import { Lead } from '../entities/lead.entity';

export interface ILeadRepository {
  createLead(lead: Lead): Promise<Lead>;
  findOne(lead: Lead): Promise<Lead | null>;
  updateLead(lead: Lead): Promise<Lead | null>;
}