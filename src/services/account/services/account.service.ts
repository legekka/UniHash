import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { timer } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { AccountBalanceEntity } from 'src/entities/account-balance.entity';
import { AccountBalanceDTO } from 'src/models/dto/account-balance-dto';
import { AccountResponse } from 'src/models/nicehash/account';
import { NicehashService } from 'src/services/nicehash/nicehash.service';
import { Repository } from 'typeorm';

@Injectable()
export class AccountService {

    private accountBalanceDTO: AccountBalanceDTO;

    constructor(
        private nicehashService: NicehashService,
        @InjectRepository(AccountBalanceEntity)
        private accountBalanceRepository: Repository<AccountBalanceEntity>,
    ) {
        this.initAccountBalance();
    }

    // Initializer

    private initAccountBalance() {
        // every 4 hours
        timer(0, 1000 * 60 * 60 * 4).pipe(
            // Getting account balance response from Nicehash
            mergeMap(() => this.nicehashService.getAccountBalance()),
            // Creating DTO
            map((accountResponse) => this.createAccountBalanceDTO(accountResponse)),
            // Saving DTO to repository and the service object
            map(accountBalanceDTO => this.addNewAccountBalance(accountBalanceDTO))
        ).subscribe();
    }

    // Public methods

    getAccountBalanceDTO(): AccountBalanceDTO {
        return this.accountBalanceDTO;
    }


    // Private helpers

    private createAccountBalanceDTO(accountResponse: AccountResponse): AccountBalanceDTO {
        return {
            currency: accountResponse.total.currency,
            totalBalance: accountResponse.total.totalBalance
        } as AccountBalanceDTO;
    }

    private addNewAccountBalance(accountBalanceDTO: AccountBalanceDTO) {
        this.accountBalanceDTO = accountBalanceDTO;
        let entity = new AccountBalanceEntity();
        entity.timestamp = new Date();
        entity.currency = accountBalanceDTO.currency,
            entity.totalBalance = accountBalanceDTO.totalBalance
        this.accountBalanceRepository.save(entity);
    }
}
