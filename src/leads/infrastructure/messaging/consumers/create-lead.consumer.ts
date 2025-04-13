import { Controller, Injectable, Logger } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateLeadUseCase } from 'src/leads/application/use-cases/create-lead/create-lead.use-case';
import { LeadMessageDTO } from '../dtos/lead-message.dto';
import { Lead } from 'src/leads/domain/entities/lead.entity';

@Controller()
export class CreateLeadConsumer {
  constructor(private readonly createLeadUseCase: CreateLeadUseCase) {}

  logger = new Logger(CreateLeadConsumer.name)

  @EventPattern('create-lead') 
  async handleCreateLead(@Ctx() context: RmqContext, @Payload() leadIN: LeadMessageDTO): Promise<void> {
    const channel = context.getChannelRef()
    const originalMsg = context.getMessage()
    const lead = new Lead(leadIN.name, leadIN.email, leadIN.phone);

    this.logger.log(`Received message: ${JSON.stringify(leadIN)}`);
    
    try {
      await this.createLeadUseCase.execute(lead);
      this.logger.log(`Mensage processed: ${JSON.stringify(leadIN)}`);
      await channel.ack(originalMsg)
    } catch(error) {
      this.logger.log(`Error creating lead: ${error.message}`);
      await channel.nack(originalMsg);
    }

    return
  }
}