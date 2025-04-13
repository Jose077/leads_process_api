import { Inject, Injectable } from '@nestjs/common';
import { ILeadRepository } from '../../domain/interfaces/lead.repository';
import { Lead } from '../../domain/entities/lead.entity';

@Injectable()
export class CreateLeadUseCase {
  constructor(
    @Inject('LeadRepository')
    private readonly leadRepository: ILeadRepository
  ) {}

  async execute(lead: Lead): Promise<Lead> {
    // Attemps to create a lead
    const ceratedLead = await this.leadRepository.createLead(lead);

    // todo: Attemps to create the lead on CRM

    return ceratedLead;
  }
}