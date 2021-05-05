import { Controller, Get } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AccountBalanceDTO } from 'src/models/dto/account-balance-dto';
import { AccountService } from 'src/services/account/services/account.service';

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
