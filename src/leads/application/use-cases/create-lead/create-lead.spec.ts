import { Test, TestingModule } from '@nestjs/testing';
import { CreateLeadUseCase } from './create-lead.use-case';
import { FakeLeadRepository } from 'src/leads/infrastructure/database/fake/repository/lead.repository';
import { Lead } from 'src/leads/domain/entities/lead.entity';
import { of, throwError } from 'rxjs';
import { ExternalHTTPModule } from 'src/leads/infrastructure/http/http.module';
import { CreateExternalLeadService } from 'src/leads/infrastructure/http/external-lead-service/create-external-lead.service';

describe('create-lead-use-case', () => {
  let createLeadUseCase: CreateLeadUseCase;
  const mockRetryLeadsQueueClient = {
    emit: jest.fn().mockReturnValue(of(true)), // mocking observable
  };

  const mockDeadLeadQueueCliente = {
    emit: jest.fn().mockReturnValue(of(true)), 
  };

  const mockCreateExternalLeadService = {
    sendLeadToExternalSystem: jest.fn().mockReturnValue(of(true)),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ExternalHTTPModule],
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
          useValue: mockDeadLeadQueueCliente,
        },
      ],
    })
    .overrideProvider(CreateExternalLeadService)
    .useValue(mockCreateExternalLeadService)
    .compile();

    createLeadUseCase = module.get<CreateLeadUseCase>(CreateLeadUseCase);
  });

  it('should be able to create a new lead', async () => {
    const lead = new Lead(
      'test-user', 
      'test-user@email.com'
    );
    const createdLead = await createLeadUseCase.execute(lead)

    expect(createdLead).toBeInstanceOf(Lead);
    expect(createdLead?.status).toEqual('processed');
  });

  it('should ignore leads missing email and phone', async () => {
    const leadMissingEmailAndPhone = new Lead('test-user');

    let createdLead = await createLeadUseCase.execute(leadMissingEmailAndPhone)
    expect(createdLead).toBeNull();
  })

  // it('should ignore leads already processed', async () => {})

  // it('should update the lead if it already exists but receive a different email or phone', async () => {})

  it('should move to the rety queue if receive any error', async () => {
    const lead = new Lead(
      'test-user', 
      'test-user@email.com'
    );

    mockCreateExternalLeadService.sendLeadToExternalSystem.mockRejectedValue(throwError(() => new Error('Fail')));
    let createdLead = await createLeadUseCase.execute(lead)
    
    expect(createdLead).toBeNull();
    expect(mockRetryLeadsQueueClient.emit).toHaveBeenCalledWith('create-lead',   
      expect.objectContaining({
        data: lead,
      })
    );
    
  });

  it('should move to the dead letter queue if retry count is greater than 5', async () => {
    const lead = new Lead(
      'test-user', 
      'test-user@email.com',  
      undefined, 
      undefined, 
      5
    );

    let createdLead = await createLeadUseCase.execute(lead)

    expect(createdLead).toBeNull();
    expect(mockDeadLeadQueueCliente.emit).toHaveBeenCalledWith('dead-lead',       
      expect.objectContaining({
        data: lead,
      })
    );
  })

  it('should move to the dead letter queue if sending to the external service fails', async () => {
    const lead = new Lead(
      'test-user', 
      'test-user@email.com'
    );

    mockCreateExternalLeadService.sendLeadToExternalSystem.mockRejectedValue(
      new Error('Fail')
    );
    mockRetryLeadsQueueClient.emit.mockReturnValue(
      throwError(() => new Error('Fail'))
    );

    let createdLead = await createLeadUseCase.execute(lead)

    expect(createdLead).toBeNull();
    expect(mockRetryLeadsQueueClient.emit).toHaveBeenCalledWith('create-lead', 
      expect.objectContaining({
        data: lead,
      })
    );
    expect(mockDeadLeadQueueCliente.emit).toHaveBeenCalledWith('dead-lead', 
      expect.objectContaining({
        data: lead,
      })
    );
  })
});
