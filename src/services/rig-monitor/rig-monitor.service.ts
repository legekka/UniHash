import { Injectable } from '@nestjs/common';
import { NicehashService } from '../nicehash/nicehash.service';
import { interval, Observable, zip } from 'rxjs';
import { mergeMap, map, tap } from 'rxjs/operators';
import { RigMiningDetails, RigMiningDetailsDTO } from 'src/models/rig-mining-details';
import { Repository } from 'typeorm';
import { RigDetails } from 'src/models/nicehash/rig-details';

@Injectable()
export class RigMonitorService {

    private rigStatsSource: Observable<RigMiningDetailsDTO[]>;

    constructor(
        private nicehashService: NicehashService,
        private rigRepository: Repository<RigMiningDetails>
    ) {
        this.initRigStats();
    }

    private initRigStats(): void {
        this.rigStatsSource = interval(30000).pipe(
            mergeMap(() => this.rigRepository.find()),
            mergeMap(rigs => zip([...rigs.map(rig => this.nicehashService.getRigDetails(rig.rigId))])),
            mergeMap(rigDetails => zip([...rigDetails.map(async rig => {
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
            })])),
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

    private createDTO(rigDetails: RigDetails, rig: RigMiningDetails): RigMiningDetailsDTO {
        let dto = rig as RigMiningDetailsDTO;
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

/*
rigId
name
currentUnpaidAmount
totalUnpaidAmount
uptimeDate

currentUnpaidAmountPercent      - calculated from all rig's currentUnpaidAmount
totalUnpaidAmountPercent        - calculated from all rig's totalUnpaidAmount
algorithm                       - rigdetails.devices[1].speeds[0]
speed                           - rigdetails.devices[1].speeds[0]
displaySuffix                   - rigdetails.devices[1].speeds[0]
temperature                     - rigdetails.devices[1]
revolutionsPerMinute            - rigdetails.devices[1]
revolutionsPerMinutePercentage  - rigdetails.devices[1]
profitability                   - rigdetails.devices[1]
localProfitability              - rigdetails.devices[1]
*/