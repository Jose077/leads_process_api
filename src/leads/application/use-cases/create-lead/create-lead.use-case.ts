import { Inject, Injectable, Logger } from '@nestjs/common';
import { ILeadRepository } from '../../../domain/interfaces/lead.repository';
import { Lead } from '../../../domain/entities/lead.entity';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { LeadStatusEnum } from 'src/leads/domain/enums/lead-status.enum';
import { CreateExternalLeadService } from 'src/leads/infrastructure/http/external-lead-service/create-external-lead.service';

@Injectable()
export class CreateLeadUseCase {
  constructor(
    @Inject('LeadRepository') 
    private readonly leadRepository: ILeadRepository,
    @Inject('RETRY_LEADS_QUEUE_CLIENT') 
    private readonly retryLeadsQueueclient: ClientProxy,
    @Inject('DEAD_LEADS_QUEUE_CLIENT') 
    private readonly deadLeadsQueueclient: ClientProxy,
    private readonly createExternalLeadService: CreateExternalLeadService
  ) {}

  logger = new Logger(CreateLeadUseCase.name)

  // Force queues creation
  async onModuleInit() {
    try {
      await this.retryLeadsQueueclient.connect();
      this.logger.log('Connected to retry leads queue');
    } catch (error) {
      this.logger.error('Failed to connect to retry leads queue', error);
    }

    try {
      await this.deadLeadsQueueclient.connect();
      this.logger.log('Connected to dead leads queue');
    } catch (error) {
      this.logger.error('Failed to connect to dead leads queue', error);
    }
  }
  
  public async execute(lead: Lead): Promise<Lead | null> {
    let createdLead: Lead | null = null;

    if (!lead.email && !lead.phone) {
      this.logger.warn(`Ignoring lead without email and phone: ${lead.name}`);
      return null;
    }

    const currentLead = await this.leadRepository.findOne(lead);

    if (currentLead?.status === LeadStatusEnum.PROCESSED) {
      this.logger.warn(`Lead ${lead.email ?? lead.phone} already processed`);
      return null;
    }

    if (currentLead) {
      lead.retryCount = currentLead.retryCount
    }

    if (lead?.retryCount >= 5) {
      this.logger.warn(`Lead ${lead.email ?? lead.phone} has reached the maximum retry count, therefore it will be moved to the dead letter queue`);
      await this.moveToDLQQueue(lead);
      return null;
    }

    // Attemps to create the lead in the database
    try {
      if (!currentLead) {
        createdLead = await this.leadRepository.createLead(lead);
      } else {
        // todo: check if email or phone has changed
      }
    } catch (error) {
      this.logger.error('Error creating lead:', error.message);
      await this.moveToRetryQueue(lead);
      return null;
    }

    // Attemps to send the lead to the external system
    try {
      await this.createExternalLeadService.sendLeadToExternalSystem({
        email: lead.email, 
        phone: lead.phone,
        name: lead.name,
      });

      lead.markAsProcessed()
      await this.leadRepository.updateLead(lead);
      return lead;
    } catch (error) {
      this.logger.log('Send lead to retry queue:', error.message);
      await this.moveToRetryQueue(lead);
      return null;
    }
  }

  private async moveToRetryQueue(lead: Lead) {
    // todo: Add custom ttl estrategy to handle retry

    try {
      const msg = new RmqRecordBuilder(lead)
      .setOptions({
        persistent: true,
      })
      .build();
      await lastValueFrom(this.retryLeadsQueueclient.emit('create-lead', msg));

      lead.status = LeadStatusEnum.RETRYING
      lead.incrementRetryCount();

      await this.leadRepository.updateLead(lead);
      
      this.logger.log(`Lead ${lead.email ?? lead.phone} moved to retry queue`);
    } catch (error) {
      this.logger.error('Error sending lead to retry queue:', error);
      await this.moveToDLQQueue(lead);
    }
  }

  private async moveToDLQQueue(lead: Lead) {
    try {
      const msg = new RmqRecordBuilder(lead)
      .setOptions({
        persistent: true,
      })
      .build();

      await lastValueFrom(this.deadLeadsQueueclient.emit('dead-lead', msg));

      lead.markAsDead();
      await this.leadRepository.updateLead(lead);

      this.logger.log(`Lead ${lead.email ?? lead.phone} moved to dlq queue`);
    } catch (error) {
      // todo: handle this error
      this.logger.error('Error sending lead to dlq queue:', error);
    }
  }
}