import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { Observable, zip } from 'rxjs';
import { map, mergeMap, take } from 'rxjs/operators';
import { RigDTO } from 'src/models/dto/rig-dto';
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
        return this.rigMonitorService.getRigSnapshots(new Date(fromDate));
    }

}