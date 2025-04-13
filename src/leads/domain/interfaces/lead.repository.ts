import { Lead } from '../entities/lead.entity';

export interface ILeadRepository {
  createLead(lead: Lead): Promise<Lead>;
}