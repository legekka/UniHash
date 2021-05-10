import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { AccountBalanceDTO } from 'src/models/dto/account-balance-dto';
import { AccountService } from 'src/services/account/account.service';

@Controller('account')
export class AccountController {
    constructor(
        private accountService: AccountService
    ) { }

    @Get('balance')
    getAccountBalance(): AccountBalanceDTO {
        return this.accountService.getAccountBalanceDTO();
    }
}
