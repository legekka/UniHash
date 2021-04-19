import { HttpModule, HttpService } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { NicehashService } from './nicehash.service';

describe('NicehashService', () => {
  let service: NicehashService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.development.env'
        }),
        HttpModule
      ],
      providers: [NicehashService],
    }).compile();

    service = module.get<NicehashService>(NicehashService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('groupAPICallTest', () => {
    service.getRigGroups().subscribe(groups => {
      expect(groups).toBeDefined();
      console.log(groups);
    })
  })
});
