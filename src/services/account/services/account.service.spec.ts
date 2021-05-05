import { Test, TestingModule } from '@nestjs/testing';
import { Services\accountService } from './services\account.service';

describe('Services\accountService', () => {
  let service: Services\accountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Services\accountService],
    }).compile();

    service = module.get<Services\accountService>(Services\accountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
