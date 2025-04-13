
import { Injectable } from '@nestjs/common';
import { ILeadRepository } from 'src/leads/domain/interfaces/lead.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead } from 'src/leads/domain/entities/lead.entity';

@Injectable()
export class LeadRepository implements ILeadRepository {
    constructor(@InjectModel(Lead.name) private leadModel: Model<Lead>) {}

    async createLead(lead: Lead): Promise<Lead> {
        const newLead =  new this.leadModel(lead)
        return await newLead.save();
    }
}