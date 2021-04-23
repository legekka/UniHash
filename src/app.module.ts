import { HttpModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NicehashService } from './services/nicehash/nicehash.service';
import { RigMonitorService } from './services/rig-monitor/rig-monitor.service';
import { Connection } from 'typeorm';
import { getConnectionOptions } from 'typeorm';
import { RigMiningDetails } from './entities/rig-mining-details.entity';
import { RigController } from './controllers/rig/rig.controller';
import { RigGateway } from './gateways/rig.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.development.env'
    }),
    HttpModule,
    TypeOrmModule.forRoot(),
    TypeOrmModule.forFeature([RigMiningDetails])
  ],
  controllers: [AppController, RigController],
  providers: [AppService, NicehashService, RigMonitorService, RigGateway],
})
export class AppModule {
  constructor(private connection: Connection) {}
}
