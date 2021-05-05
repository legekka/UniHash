import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NicehashService } from '../nicehash/nicehash.service';
import { Observable, of, ReplaySubject, timer, zip, from } from 'rxjs';
import { mergeMap, map, tap } from 'rxjs/operators';
import { RigDTO } from 'src/models/dto/rig-dto';
import { Groups } from 'src/models/nicehash/group';
import { Rig } from 'src/models/nicehash/rig';
import { MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { RigDetails } from 'src/models/nicehash/rig-details';
import { RigEntity } from 'src/entities/rig.entity';
import { RigSnapshotEntity } from 'src/entities/rig-snapshot.entity';
import { Algorithm } from 'src/models/nicehash/algorithm.enum';
import { RigSnapshotDTO } from 'src/models/dto/rig-snapshot-dto';
import { CreateRigDTOsFromSnapshots, CreateRigSnapshotDTO } from 'src/models/mapper/rig-dto-mapper';

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
            // Getting active rigs from DB
            mergeMap(() => this.rigRepository.find({ where: { active: true } })),
            // Getting rig details from Nicehash API
            mergeMap(rigs => zip(...rigs.map(rig => this.nicehashService.getRigDetails(rig.rigId)))),
            // Attaching timestamp
            map(rigs => [new Date(), rigs]),
            // Creating snapshots from rig details
            mergeMap(([date, rigDetails]: [Date, RigDetails[]]) => Promise.all(rigDetails.map(rigDetail => this.createRigSnapshot(date, rigDetail)))),
            // Saving snapshots
            mergeMap((rigSnapshots: RigSnapshotEntity[]) => this.rigSnapshotRepository.save(rigSnapshots)),
            // Creating DTOs from snapshots
            map((rigSnapshots: RigSnapshotEntity[]) => CreateRigDTOsFromSnapshots(rigSnapshots)),
            // Emitting data
            tap(dtos => this.rigMiningDetailsSource.next(dtos))
        ).subscribe();
    }

    // Public methods

    public getRigMiningDetailsStream(): Observable<RigDTO[]> {
        return this.rigMiningDetailsSource.asObservable();
    }

    public getRigSnapshots(fromDate: Date): Observable<RigDTO[]> {
        return from(this.rigSnapshotRepository.find({ where: { timestamp: MoreThanOrEqual(fromDate) } })).pipe(
            map(snapshots => CreateRigDTOsFromSnapshots(snapshots))
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
        rigDetails.unpaidAmount = parseFloat(`${rigDetails.unpaidAmount}`);

        const rig: RigEntity = await this.rigRepository.findOne({ where: { rigId: rigDetails.rigId } });
        let temperature: number;
        let revolutionsPerMinute: number;
        let revolutionsPerMinutePercentage: number;
        let speed: number;
        let algorithm: Algorithm;
        let displaySuffix: string;
        let powerUsage: number;
        if (rigDetails.devices.length >= 2) {
            temperature = rigDetails.devices[1].temperature % 65536
            revolutionsPerMinute = rigDetails.devices[1].revolutionsPerMinute;
            revolutionsPerMinutePercentage = rigDetails.devices[1].revolutionsPerMinutePercentage;
            powerUsage = rigDetails.devices[1].powerUsage;
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
            powerUsage,
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
        const rig = await this.rigRepository.findOne({ where: { rigId: rigDetails.rigId } });
        const lastRigSnapshot = await this.rigSnapshotRepository.findOne({ 
            where: { rig: rig }, 
            order: { timestamp: 'DESC' } 
        });
        if (lastRigSnapshot == null) {
            return 0;
        }
        if (lastRigSnapshot.currentUnpaidAmount > rigDetails.unpaidAmount) {
            return lastRigSnapshot.totalUnpaidAmount + rigDetails.unpaidAmount;
        }
        return lastRigSnapshot.totalUnpaidAmount;
    }

}