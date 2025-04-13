import { Inject, Injectable, Logger } from '@nestjs/common';
import { ILeadRepository } from '../../../domain/interfaces/lead.repository';
import { Lead } from '../../../domain/entities/lead.entity';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { LeadStatusEnum } from 'src/leads/domain/enums/lead-status.enum';

@Injectable()
export class CreateLeadUseCase {
  constructor(
    @Inject('LeadRepository') 
    private readonly leadRepository: ILeadRepository,
    @Inject('RETRY_LEADS_QUEUE_CLIENT') 
    private readonly retryLeadsQueueclient: ClientProxy,
    @Inject('DEAD_LEADS_QUEUE_CLIENT') 
    private readonly deadLeadsQueueclient: ClientProxy
  ) {}

  logger = new Logger(CreateLeadUseCase.name)
  
  public async execute(lead: Lead): Promise<Lead | null> {
    if (!lead.email && !lead.phone) {
      this.logger.warn(`Ignoring lead without email and phone: ${lead.name}`);
      return null;
    }

    if (lead.retryCount && lead.retryCount >= 5) {
      this.logger.warn(`Lead ${lead} has reached the maximum retry count, therefore it will be moved to the dead letter queue`);
      await this.moveToDLQQueue(lead);
      return null;
    }

    try {
      const createdLead = await this.leadRepository.createLead(lead);
      return createdLead;
    } catch (error) {
      this.logger.error('Error creating lead:', error.message);
      await this.moveToRetryQueue(lead);
      return null;
    }

    // todo: Attemps to create the lead on CRM
    // todo: change status to processed
    
  }

  private async moveToRetryQueue(lead: Lead) {
    // todo: Add custom ttl estrategy to handle retry

    lead.status = LeadStatusEnum.RETRYING
    lead.incrementRetryCount();
    await this.leadRepository.updateLead(lead);

    try {
      await lastValueFrom(this.retryLeadsQueueclient.emit<Lead>('retry-lead', lead));
      this.logger.log(`Lead ${lead} moved to retry queue`);
    } catch (error) {
      this.logger.error('Error sending lead to retry queue:', error);
      await this.moveToDLQQueue(lead);
    }
  }

  private async moveToDLQQueue(lead: Lead) {
    try {
      await lastValueFrom(this.deadLeadsQueueclient.emit('dead-lead', lead));

      lead.markAsDead();
      await this.leadRepository.updateLead(lead);

      this.logger.log(`Lead ${lead} moved to dlq queue`);
    } catch (error) {
      // todo: handle this error
      this.logger.error('Error sending lead to retry queue:', error);
    }
  }
}