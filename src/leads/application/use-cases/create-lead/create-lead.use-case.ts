import { Inject, Injectable, Logger } from '@nestjs/common';
import { ILeadRepository } from '../../../domain/interfaces/lead.repository';
import { Lead } from '../../../domain/entities/lead.entity';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CreateLeadUseCase {
  constructor(
    @Inject('LeadRepository') 
    private readonly leadRepository: ILeadRepository,
    @Inject('LEADS_RETRY_CLIENT') 
    private client: ClientProxy
  ) {}

  logger = new Logger(CreateLeadUseCase.name)
  
  async execute(lead: Lead): Promise<Lead> {
    // todo: Should ignore leads that dont have email and phone

    try {
      const createdLead = await this.leadRepository.createLead(lead);
      return createdLead;
    } catch (error) {
      this.logger.error('Error creating lead:', error);
      await moveToRetryQueue(lead);
      return lead;
    }

    // todo: Attemps to create the lead on CRM
  }
}

async function moveToRetryQueue(lead: Lead) {
  try {
    await lastValueFrom(this.client.emit('retry-lead', lead));
    this.logger.log(`Lead ${lead.name} moved to retry queue`);
  } catch (error) {
    // TODO: Send to dead letter queue
    this.logger.error('Error sending lead to retry queue:', error);
    throw new Error('Error sending lead to retry queue');
  }
}