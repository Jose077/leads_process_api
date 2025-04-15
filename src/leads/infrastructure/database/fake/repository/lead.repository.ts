import { Lead } from "src/leads/domain/entities/lead.entity";
import { ILeadRepository } from "src/leads/domain/interfaces/lead.repository";

export class FakeLeadRepository implements ILeadRepository {
  private leads: Lead[] = [];

  async createLead(lead: Lead): Promise<Lead> {
    const leadExists = this.leads.find((l) => l.email === lead.email || l.phone === lead.phone);
    if (leadExists) {
      throw new Error('Lead already exists');
    }

    this.leads.push(lead);
    return lead;
  }

  async updateLead(lead: Lead): Promise<Lead | null> {
    const index = this.leads.findIndex((l) => l.email === lead.email || l.phone === lead.phone);

    if (index === -1) {
      return null;
    }

    this.leads[index].email = lead.email || this.leads[index].email;
    this.leads[index].phone = lead.phone || this.leads[index].phone;
    this.leads[index].retryCount = lead.retryCount || this.leads[index].retryCount;
    this.leads[index].status = lead.status || this.leads[index].status;
    this.leads[index].name = lead.name || this.leads[index].name;
    
    return this.leads[index];
  }

  async findOne(lead: Lead): Promise<Lead | null> {
    const found = this.leads.find((l) => l.email === lead.email || l.phone === lead.phone);
    return found || null;
  }
}
