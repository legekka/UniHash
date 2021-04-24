import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { Observable, zip } from 'rxjs';
import { map, mergeMap, take } from 'rxjs/operators';
import { RigDTO } from 'src/models/rig-mining-details-dto';
import { RigMonitorService } from 'src/services/rig-monitor/rig-monitor.service';

@Controller('rig')
export class RigController {

    constructor(
        private rigMonitorService: RigMonitorService
    ) {}

    @Get('snapshots')
    getRigSnapshots(@Query('from') fromDate: number): Observable<RigDTO[]> {
        let now = Date.now();
        if (fromDate == null) {
            fromDate = now - 1000*60*60*2;
        }
        if (fromDate < now - 1000*60*60*24) {
            throw new BadRequestException();
        }
        return zip(
            this.rigMonitorService.getRigSnapshots(new Date(fromDate)),
            this.rigMonitorService.getRigMiningDetailsStream().pipe(take(1))
        ).pipe(
            map(([snapshots, lastSnapshots]: [RigDTO[], RigDTO[]]) => {
                lastSnapshots.forEach(lastSnapshot => {
                    if (snapshots.every(snapshot => snapshot.snapshotId !== lastSnapshot.snapshotId)) {
                        snapshots.push(lastSnapshot);
                    }
                });
                return snapshots;
            })
        );
    }

}
