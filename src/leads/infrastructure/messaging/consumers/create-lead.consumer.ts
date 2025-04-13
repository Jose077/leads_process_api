import { Controller, Injectable, Logger } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateLeadUseCase } from 'src/leads/application/use-cases/create-lead.service';
import { LeadMessageDTO } from '../dtos/lead-message.dto';
import { Lead } from 'src/leads/domain/entities/lead.entity';

@Controller()
export class CreateLeadConsumer {
  constructor(private readonly createLeadUseCase: CreateLeadUseCase) {}

  logger = new Logger(CreateLeadConsumer.name)

  @EventPattern('create-lead') 
  async handleCreateLead(@Ctx() context: RmqContext, @Payload() data: LeadMessageDTO): Promise<void> {
    const channel = context.getChannelRef()
    const originalMsg = context.getMessage()
    const lead = new Lead(data.name, data.email, data.phone);

    this.logger.log(`Received message: ${JSON.stringify(data)}`);
    
    try {
      await this.createLeadUseCase.execute(lead);
      this.logger.log(`Mensage processed: ${JSON.stringify(data)}`);
      await channel.ack(originalMsg)
    } catch(error) {
      this.logger.log(`Error creating lead: ${error.message}`);
      await channel.nack(originalMsg);
    }

    return
  }
}