import { BadRequestException, Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { RigDTO } from 'src/models/dto/rig-dto';
import { RigMonitorService } from 'src/services/rig-monitor/rig-monitor.service';

@Controller('rig')
export class RigController {

    private apiKey: string;

    constructor(
        private rigMonitorService: RigMonitorService,
        private configService: ConfigService
    ) { this.apiKey = configService.get<string>('UNIHASH_API_KEY') }

    @Get('snapshots')
    getRigSnapshots(@Query('from') fromDate: number): Observable<RigDTO[]> {
        let now = Date.now();
        if (fromDate == null) {
            fromDate = now - 1000 * 60 * 60 * 2;
        }
        if (fromDate < now - 1000 * 60 * 60 * 24) {
            throw new BadRequestException();
        }
        return this.rigMonitorService.getRigSnapshots(new Date(fromDate));
    }

    @Get('gettotals')
    async getTotals(@Query('key') apiKey: string): Promise<any> {
        if (apiKey != this.apiKey) {
            throw new BadRequestException();
        }
        return await this.rigMonitorService.getTotals();;
    }

    @Get('resettotals')
    async resetTotals(@Query('key') apiKey: string) {
        if (apiKey != this.apiKey) {
            throw new BadRequestException();
        }
        await this.rigMonitorService.resetTotals();
        return {statusCode: 200, message: "ok"};
    }
}