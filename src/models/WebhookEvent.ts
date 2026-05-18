import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebhookEvent extends Document {
  eventId: string;
  processedAt: Date;
  status: 'PROCESSED' | 'FAILED';
}

const WebhookEventSchema: Schema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    processedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['PROCESSED', 'FAILED'], default: 'PROCESSED' },
  },
  { timestamps: true }
);

export const WebhookEvent: Model<IWebhookEvent> =
  mongoose.models.WebhookEvent || mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
