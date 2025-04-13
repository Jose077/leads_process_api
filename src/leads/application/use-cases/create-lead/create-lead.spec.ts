import { Test, TestingModule } from '@nestjs/testing';
import { CreateLeadUseCase } from './create-lead.use-case';
import { FakeLeadRepository } from 'src/leads/infrastructure/database/fake/repository/lead.repository';
import { Lead } from 'src/leads/domain/entities/lead.entity';

describe('create-lead-use-case', () => {
  let createLeadUseCase: CreateLeadUseCase;
  const mockLeadsProxy = {
    emit: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateLeadUseCase,
        {
          provide: 'LeadRepository',
          useClass: FakeLeadRepository,
        },
        {
          provide: 'LEADS_RETRY_CLIENT',
          useValue: mockLeadsProxy,
        }
      ],
    }).compile();

    createLeadUseCase = module.get<CreateLeadUseCase>(CreateLeadUseCase);
  });

  it('should be able to create a new lead', async () => {
    const lead = new Lead('test-user', 'test-user@email.com');
    await expect(createLeadUseCase.execute(lead)).resolves.toBeInstanceOf(Lead);
  });

  it('should ignore leads that dont have email and phone', async () => {
    const leadMissingEmailAndPhone = new Lead('test-user');
    await expect(createLeadUseCase.execute(leadMissingEmailAndPhone)).rejects.toThrow(Error)
  })

  it('should move to the rety queue if receive any error', async () => {
    const lead = new Lead('test-user', 'test-user@email.com');

    // Creating the lead for the first time
    expect(createLeadUseCase.execute(lead))

    // attemps to create the same lead again to result in an error
    expect(createLeadUseCase.execute(lead)).rejects.toBeInstanceOf(Error) //toThrow(Error)

    // check if the lead was moved to the retry queue
    // expect(mockLeadsProxy.emit).toHaveBeenCalledWith('retry-lead', lead);
    expect(mockLeadsProxy.emit).toHaveBeenCalledTimes(1);
  });

  it('should move to the dead letter queue if the move to retry queue fails', async () => {})
});
