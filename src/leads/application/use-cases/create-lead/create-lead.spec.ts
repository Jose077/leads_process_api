import { Test, TestingModule } from '@nestjs/testing';
import { CreateLeadUseCase } from './create-lead.use-case';
import { FakeLeadRepository } from 'src/leads/infrastructure/database/fake/repository/lead.repository';
import { Lead } from 'src/leads/domain/entities/lead.entity';
import { of, throwError } from 'rxjs';

describe('create-lead-use-case', () => {
  let createLeadUseCase: CreateLeadUseCase;
  const mockRetryLeadsQueueClient = {
    emit: jest.fn().mockReturnValue(of(true)), // mocking observable
  };

  const mocDeadLeadQueueCliente = {
    emit: jest.fn().mockReturnValue(of(true)), // mocking observable
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
          provide: 'RETRY_LEADS_QUEUE_CLIENT',
          useValue: mockRetryLeadsQueueClient,
        },
        {
          provide: 'DEAD_LEADS_QUEUE_CLIENT',
          useValue: mocDeadLeadQueueCliente,
        }
      ],
    }).compile();

    createLeadUseCase = module.get<CreateLeadUseCase>(CreateLeadUseCase);
  });

  it('should be able to create a new lead', async () => {
    const lead = new Lead('test-user', 'test-user@email.com');
    await expect(createLeadUseCase.execute(lead)).resolves.toBeInstanceOf(Lead);
  });

  it('should ignore leads missing an email and phone', async () => {
    const leadMissingEmailAndPhone = new Lead('test-user');
    let createdLead = await createLeadUseCase.execute(leadMissingEmailAndPhone)
    expect(createdLead).toBeNull();
  })

  // it('should ignore leads already processed', async () => {})
  // it('should update the lead if it already exists but receive a different email or phone', async () => {})

  it('should move to the rety queue if receive any error', async () => {
    const lead = new Lead('test-user', 'test-user@email.com');
    await createLeadUseCase.execute(lead)

    let createdLead = await createLeadUseCase.execute(lead)
    expect(createdLead).toBeNull();
    expect(mockRetryLeadsQueueClient.emit).toHaveBeenCalledWith('retry-lead', lead);
    
  });

  it('should move to the dead letter queue if retry count is greater than 5', async () => {
    const lead = new Lead('test-user', 'test-user@email.com',  undefined, undefined, 5);
    let createdLead = await createLeadUseCase.execute(lead)
    expect(createdLead).toBeNull();
    expect(mocDeadLeadQueueCliente.emit).toHaveBeenCalledWith('dead-lead', lead);
  })

  it('should move to the dead letter queue if moving to retry queue fails', async () => {
    const lead = new Lead('test-user', 'test-user@email.com');
    await createLeadUseCase.execute(lead)

    mockRetryLeadsQueueClient.emit.mockReturnValue(throwError(() => new Error('fail')));
    let createdLead = await createLeadUseCase.execute(lead)
    expect(createdLead).toBeNull();
    expect(mockRetryLeadsQueueClient.emit).toHaveBeenCalledWith('retry-lead', lead);
    expect(mocDeadLeadQueueCliente.emit).toHaveBeenCalledWith('dead-lead', lead);
  })
});
