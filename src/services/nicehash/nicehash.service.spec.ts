import { Test, TestingModule } from '@nestjs/testing';
import { NicehashService } from './nicehash.service';

describe('NicehashService', () => {
  let service: NicehashService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NicehashService],
    }).compile();

    service = module.get<NicehashService>(NicehashService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
