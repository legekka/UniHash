import { Test, TestingModule } from '@nestjs/testing';
import { RigController } from './rig.controller';

describe('RigController', () => {
  let controller: RigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RigController],
    }).compile();

    controller = module.get<RigController>(RigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
