import { Controller, Get } from '@nestjs/common';
import { CoinbaseService, PriceData } from 'src/services/coinbase/coinbase.service';

@Controller('price')
export class PriceController {
    constructor(
        private coinbaseService: CoinbaseService
    ) { }

    @Get('current')
    getAccountBalance(): PriceData {
        return this.coinbaseService.getCurrentPrice();
    }
}
