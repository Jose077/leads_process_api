import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { LeadStatus } from 'src/leads/domain/enums/lead-status.enum';

export type CatDocument = HydratedDocument<Lead>;

@Schema({ timestamps: true })
export class Lead {
  @Prop()
  name?: string;

  @Prop({ unique: true })
  email?: string;

  @Prop({ unique: true })
  phone?: string;

  @Prop()
  source?: string;

  @Prop({ default: 'pending' })
  status: LeadStatus

  @Prop()
  retryCount?: number;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);