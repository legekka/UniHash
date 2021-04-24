import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NicehashService } from '../nicehash/nicehash.service';
import { Observable, of, ReplaySubject, timer, zip, from } from 'rxjs';
import { mergeMap, map, tap } from 'rxjs/operators';
import { RigDTO } from 'src/models/rig-mining-details-dto';
import { Groups } from 'src/models/nicehash/group';
import { Rig } from 'src/models/nicehash/rig';
import { MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { RigDetails } from 'src/models/nicehash/rig-details';
import { RigEntity } from 'src/entities/rig.entity';
import { RigSnapshotEntity } from 'src/entities/rig-snapshot.entity';
import { Algorithm } from 'src/models/nicehash/algorithm.enum';

@Injectable()
export class RigMonitorService {

    private rigMiningDetailsSource: ReplaySubject<RigDTO[]> = new ReplaySubject(1);

    constructor(
        private nicehashService: NicehashService,
        @InjectRepository(RigEntity)
        private rigRepository: Repository<RigEntity>,
        @InjectRepository(RigSnapshotEntity)
        private rigSnapshotRepository: Repository<RigSnapshotEntity>
    ) {
        this.initGroups();
        this.initRigStats();
    }

    // Initializers

    private initGroups(): void {
        // Every 4 hours
        timer(0, 1000*60*60*4).pipe(
            mergeMap(() => this.nicehashService.getRigGroups()),
            map((groups: Groups) => {
                const rigs: Rig[] = [];
                Object.values(groups.groups).forEach(group => rigs.push(...group.rigs));
                return rigs;
            }),
            tap(async (rigs: Rig[]) => await this.updateOrAddNewRigs(rigs)),
            tap(async (rigs: Rig[]) => await this.deactivateRemovedRigs(rigs))
        ).subscribe();
    }

    private initRigStats(): void {
        // Every 30 seconds
        timer(0, 1000*30).pipe(
            // Getting rigs from DB
            mergeMap(() => this.rigRepository.find()),
            // Getting rig details from Nicehash API
            mergeMap(rigs => zip(...rigs.map(rig => this.nicehashService.getRigDetails(rig.rigId)))),
            // Attaching timestamp
            map(rigs => [new Date(), rigs]),
            // Creating snapshots from rig details
            mergeMap(([date, rigDetails]: [Date, RigDetails[]]) => zip(of(rigDetails), Promise.all(rigDetails.map(rigDetail => this.createRigSnapshot(date, rigDetail))))),
            // Saving snapshots
            mergeMap(([rigDetails, rigSnapshots]: [RigDetails[], RigSnapshotEntity[]]) => zip(of(rigDetails), this.rigSnapshotRepository.save(rigSnapshots))),
            // Creating DTOs from rig details and snapshots
            map(([rigDetails, rigSnapshots]: [RigDetails[], RigSnapshotEntity[]]) => {
                return rigDetails.map((rig, i) => this.createDTO(rig, rigSnapshots[i]));
            }),
            // Calculating percentages
            map(dtos => this.calculatePercentages(dtos)),
            // Emitting data on source
            tap(dtos => this.rigMiningDetailsSource.next(dtos))
        ).subscribe();
    }

    // Public methods

    public getRigMiningDetailsStream(): Observable<RigDTO[]> {
        return this.rigMiningDetailsSource.asObservable();
    }

    public getRigSnapshots(fromDate: Date): Observable<RigDTO[]> {
        return from(this.rigSnapshotRepository.find({ where: { timestamp: MoreThanOrEqual(fromDate) } })).pipe(
            map(snapshots => snapshots.map(snapshot => this.createDTOFromSnapshot(snapshot)))
        );
    }

    // Private helpers

    private async updateOrAddNewRigs(rigs: Rig[]): Promise<void> {
        const updatedRigs: RigEntity[] = [];
        for (const rig of rigs) {
            let rigMiningDetails = await this.rigRepository.findOne({ where: { rigId: rig.rigId } });
            if (rigMiningDetails == null) {
                rigMiningDetails = {
                    id: null,
                    rigId: rig.rigId,
                    name: rig.name,
                    active: true
                };
                updatedRigs.push(rigMiningDetails);
            } else {
                if (rig.name !== rigMiningDetails.name) {
                    rigMiningDetails.name = rig.name;
                    updatedRigs.push(rigMiningDetails);
                }
                if (!rigMiningDetails.active) {
                    rigMiningDetails.active = true;
                    updatedRigs.push(rigMiningDetails);
                }
            }
        }
        await this.rigRepository.save(updatedRigs);
    }

    private async deactivateRemovedRigs(rigs: Rig[]): Promise<void> {
        const rigIds = rigs.map(rig => rig.rigId);
        const rigEntities = await this.rigRepository.find();
        const rigsToDeactivate: RigEntity[] = [];
        for (const rigEntity of rigEntities) {
            if (!rigIds.includes(rigEntity.rigId)) {
                rigEntity.active = false;
                rigsToDeactivate.push(rigEntity);
            }
        }
        this.rigRepository.save(rigsToDeactivate);
    }

    private async createRigSnapshot(timestamp: Date, rigDetails: RigDetails): Promise<RigSnapshotEntity> {
        const rig: RigEntity = await this.rigRepository.findOne({ where: { rigId: rigDetails.rigId } });
        let temperature: number;
        let revolutionsPerMinute: number;
        let revolutionsPerMinutePercentage: number;
        let speed: number;
        let algorithm: Algorithm;
        let displaySuffix: string;
        if (rigDetails.devices.length >= 2) {
            temperature = rigDetails.devices[1].temperature
            revolutionsPerMinute = rigDetails.devices[1].revolutionsPerMinute;
            revolutionsPerMinutePercentage = rigDetails.devices[1].revolutionsPerMinutePercentage;
            if (rigDetails.devices[1].speeds.length >= 1) {
                speed = rigDetails.devices[1].speeds[0].speed;
                algorithm = rigDetails.devices[1].speeds[0].algorithm;
                displaySuffix = rigDetails.devices[1].speeds[0].displaySuffix;
            }
        }
        let totalUnpaidAmount = await this.calculateTotalUnpaidAmount(rigDetails);
        return {
            id: null,
            rig,
            timestamp,
            currentUnpaidAmount: rigDetails.unpaidAmount,
            totalUnpaidAmount,
            speed,
            displaySuffix,
            temperature,
            profitability: rigDetails.profitability,
            minerStatus: rigDetails.minerStatus,
            statusTime: new Date(rigDetails.statusTime),
            algorithm,
            revolutionsPerMinute,
            revolutionsPerMinutePercentage
        };
    }

    private async calculateTotalUnpaidAmount(rigDetails: RigDetails): Promise<number> {
        const lastRigSnapshot = await this.rigSnapshotRepository.findOne({ 
            where: { 
                rig: { 
                    rigId: rigDetails.rigId 
                } 
            }, 
            order: { 
                timestamp: 'DESC' 
            } 
        });
        if (lastRigSnapshot == null) {
            return 0;
        }
        if (lastRigSnapshot.currentUnpaidAmount > rigDetails.unpaidAmount) {
            return lastRigSnapshot.totalUnpaidAmount + rigDetails.unpaidAmount;
        }
        return lastRigSnapshot.totalUnpaidAmount;
    }

    private createDTO(rigDetails: RigDetails, rigSnapshot: RigSnapshotEntity): RigDTO {
        const dto: RigDTO = {
            rig: {
                id: rigSnapshot.rig.id,
                rigId: rigSnapshot.rig.rigId,
                name: rigSnapshot.rig.name,
            },
            snapshotId: rigSnapshot.id,
            timestamp: rigSnapshot.timestamp,
            currentUnpaidAmount: rigSnapshot.currentUnpaidAmount,
            totalUnpaidAmount: rigSnapshot.totalUnpaidAmount,
            statusTime: rigSnapshot.statusTime,
            minerStatus: rigSnapshot.minerStatus,
            profitability: rigSnapshot.profitability
        };
        if (rigDetails.devices.length >= 2) {
            dto.temperature = rigDetails.devices[1].temperature;
            dto.revolutionsPerMinute = rigDetails.devices[1].revolutionsPerMinute;
            dto.revolutionsPerMinutePercentage = rigDetails.devices[1].revolutionsPerMinutePercentage;
            if (rigDetails.devices[1].speeds.length >= 1) {
                dto.speed = rigDetails.devices[1].speeds[0].speed;
                dto.algorithm = rigDetails.devices[1].speeds[0].algorithm;
                dto.displaySuffix = rigDetails.devices[1].speeds[0].displaySuffix;
            }
        }
        return dto;
    }

    private createDTOFromSnapshot(rigSnapshot: RigSnapshotEntity): RigDTO {
        const dto: RigDTO = {
            rig: {
                id: rigSnapshot.rig.id,
                rigId: rigSnapshot.rig.rigId,
                name: rigSnapshot.rig.name,
            },
            snapshotId: rigSnapshot.id,
            timestamp: rigSnapshot.timestamp,
            currentUnpaidAmount: rigSnapshot.currentUnpaidAmount,
            totalUnpaidAmount: rigSnapshot.totalUnpaidAmount,
            statusTime: rigSnapshot.statusTime,
            minerStatus: rigSnapshot.minerStatus,
            profitability: rigSnapshot.profitability,
            speed: rigSnapshot.speed,
            displaySuffix: rigSnapshot.displaySuffix,
            temperature: rigSnapshot.temperature
        };
        return dto;
    }

    private calculatePercentages(dtos: RigDTO[]): RigDTO[] {
        const currentUnpaidAmountTotal = dtos.reduce((total, current) => total += current.currentUnpaidAmount, 0);
        const totalUnpaidAmountTotal = dtos.reduce((total, current) => total += current.totalUnpaidAmount, 0);
        dtos.forEach(dto => {
            dto.currentUnpaidAmountPercent = dto.currentUnpaidAmount / currentUnpaidAmountTotal;
            dto.totalUnpaidAmountPercent = dto.totalUnpaidAmount / totalUnpaidAmountTotal;
        });
        return dtos;
    }

}