import { Test, TestingModule } from '@nestjs/testing';
import { RigMonitorService } from './rig-monitor.service';

describe('RigMonitorService', () => {
  let service: RigMonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RigMonitorService],
    }).compile();

    service = module.get<RigMonitorService>(RigMonitorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
