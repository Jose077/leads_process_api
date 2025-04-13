import { Lead } from '../entities/lead.entity';

export interface ILeadRepository {
  createLead(lead: Lead): Promise<Lead>;
  updateLead(lead: Lead): Promise<Lead | null>;
}