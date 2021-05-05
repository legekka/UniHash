import { HttpModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NicehashService } from './services/nicehash/nicehash.service';
import { RigMonitorService } from './services/rig-monitor/rig-monitor.service';
import { Connection } from 'typeorm';
import { RigEntity } from './entities/rig.entity';
import { RigController } from './controllers/rig/rig.controller';
import { RigGateway } from './gateways/rig.gateway';
import { RigSnapshotEntity } from './entities/rig-snapshot.entity';
import { AccountBalanceEntity } from './entities/account-balance.entity';
import { AccountController } from './controllers/account/account.controller';
import { AccountService } from './services/account/services/account.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.development.env'
    }),
    HttpModule,
    TypeOrmModule.forRoot(),
    TypeOrmModule.forFeature([RigEntity, RigSnapshotEntity, AccountBalanceEntity])
  ],
  controllers: [AppController, RigController, AccountController],
  providers: [AppService, NicehashService, RigMonitorService, RigGateway, AccountService],
})
export class AppModule {
  constructor(private connection: Connection) { }
}
