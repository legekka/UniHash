import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NicehashService } from '../nicehash/nicehash.service';
import { Observable, timer, zip } from 'rxjs';
import { mergeMap, map, tap } from 'rxjs/operators';
import { RigMiningDetailsDTO } from 'src/models/rig-mining-details-dto';
import { Groups } from 'src/models/nicehash/group';
import { Rig } from 'src/models/nicehash/rig';
import { Repository } from 'typeorm';
import { RigDetails } from 'src/models/nicehash/rig-details';
import { RigMiningDetails } from 'src/entities/rig-mining-details.entity';

@Injectable()
export class RigMonitorService {

    private groupsSource: Observable<Rig[]>;
    private rigStatsSource: Observable<RigMiningDetailsDTO[]>;

    constructor(
        private nicehashService: NicehashService,
        @InjectRepository(RigMiningDetails)
        private rigRepository: Repository<RigMiningDetails>
    ) {
        this.initGroups();
        this.initRigStats();

        this.groupsSource.subscribe();
        this.rigStatsSource.subscribe();
    }

    private initGroups(): void {
        // Every 4 hours
        this.groupsSource = timer(0, 1000*60*60*4).pipe(
            mergeMap(() => this.nicehashService.getRigGroups()),
            map((groups: Groups) => {
                const rigs: Rig[] = [];
                Object.values(groups.groups).forEach(group => rigs.push(...group.rigs));
                return rigs;
            }),
            tap((rigs: Rig[]) => this.updateOrAddNewRigs(rigs)),
            tap((rigs: Rig[]) => this.deleteRemovedRigs(rigs))
        );
    }

    private initRigStats(): void {
        // Every 30 seconds
        console.log("anyád")
        this.rigStatsSource = timer(0, 1000*30).pipe(
            mergeMap(() => this.rigRepository.find()),
            mergeMap(rigs => zip(...rigs.map(rig => this.nicehashService.getRigDetails(rig.rigId)))),
            mergeMap(rigDetails => zip(...rigDetails.map(async rig => {
                const rigMiningDetails = await this.rigRepository.findOne({
                    where: {
                        rigId: rig.rigId
                    }
                });
                if (rigMiningDetails.currentUnpaidAmount > rig.unpaidAmount) {
                    rigMiningDetails.totalUnpaidAmount += rigMiningDetails.currentUnpaidAmount;
                }
                rigMiningDetails.currentUnpaidAmount = rig.unpaidAmount;
                await this.rigRepository.save(rigMiningDetails);
                return this.createDTO(rig, rigMiningDetails);
            }))),
            map(dtos => {
                const currentUnpaidAmountTotal = dtos.reduce((total, current) => total += current.currentUnpaidAmount, 0);
                const totalUnpaidAmountTotal = dtos.reduce((total, current) => total += current.totalUnpaidAmount, 0);
                dtos.forEach(dto => {
                    dto.currentUnpaidAmountPercent = dto.currentUnpaidAmount / currentUnpaidAmountTotal;
                    dto.totalUnpaidAmountPercent = dto.totalUnpaidAmount / totalUnpaidAmountTotal;
                });
                return dtos;
            })
        );
    }

    // Private helpers

    private updateOrAddNewRigs(rigs: Rig[]): void {
        rigs.forEach(async rig => {
            let rigMiningDetails = await this.rigRepository.findOne({ where: { rigId: rig.rigId } });
            if (rigMiningDetails == null) {
                rigMiningDetails = {
                    id: null,
                    rigId: rig.rigId,
                    name: rig.name,
                    currentUnpaidAmount: 0,
                    totalUnpaidAmount: 0,
                    uptimeDate: Date.now()
                };
            } else if (rig.name !== rigMiningDetails.name) {
                rigMiningDetails.name = rig.name;
            }
            await this.rigRepository.save(rigMiningDetails);
        })
    }

    private async deleteRemovedRigs(rigs: Rig[]) {
        const rigMiningDetailsList = await this.rigRepository.find();
        rigMiningDetailsList.forEach(async rigMiningDetails => {
            if (rigs.every(rig => rig.rigId !== rigMiningDetails.rigId)) {
                await this.rigRepository.delete({ rigId: rigMiningDetails.rigId });
            }
        });
    }

    private createDTO(rigDetails: RigDetails, rig: RigMiningDetails): RigMiningDetailsDTO {
        const dto: RigMiningDetailsDTO = {
            id: rig.id,
            rigId: rig.rigId,
            name: rig.name,
            currentUnpaidAmount: rig.currentUnpaidAmount,
            totalUnpaidAmount: rig.totalUnpaidAmount,
            uptimeDate: rig.uptimeDate
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
        dto.profitability = rigDetails.profitability;
        dto.localProfitability = rigDetails.localProfitability;
        dto.minerStatus = rigDetails.minerStatus;
        return dto;
    }

}