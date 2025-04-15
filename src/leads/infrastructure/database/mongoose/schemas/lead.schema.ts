import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { LeadStatusEnum } from 'src/leads/domain/enums/lead-status.enum';

export type CatDocument = HydratedDocument<Lead>;

@Schema({ timestamps: true })
export class Lead {
  @Prop()
  name?: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop()
  source?: string;

  @Prop({ default: 'pending' })
  status: LeadStatusEnum

  @Prop()
  retryCount?: number;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);