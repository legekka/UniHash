import { HttpModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NicehashService } from './services/nicehash/nicehash.service';
import { RigMonitorService } from './services/rig-monitor/rig-monitor.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.development.env'
    }),
    HttpModule,
    TypeOrmModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService, NicehashService, RigMonitorService],
})
export class AppModule { }
