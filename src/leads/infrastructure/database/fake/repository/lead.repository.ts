import { Lead } from "src/leads/domain/entities/lead.entity";
import { ILeadRepository } from "src/leads/domain/interfaces/lead.repository";

export class FakeLeadRepository implements ILeadRepository {
  private leads: Lead[] = [];

  async createLead(lead: Lead): Promise<Lead> {
    // should return an error if the lead already exists
    const leadExists = this.leads.find((l) => l.email === lead.email || l.phone === lead.phone);
    if (leadExists) {
      throw new Error('Lead already exists');
    }

    this.leads.push(lead);
    return lead;
  }

  updateLead(lead: Lead): Promise<Lead | null> {
    throw new Error("Method not implemented.");
  }

  findOne(lead: Lead): Promise<Lead | null> {
    throw new Error("Method not implemented.");
  }

}