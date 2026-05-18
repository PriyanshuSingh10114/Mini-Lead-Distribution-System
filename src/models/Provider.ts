import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProvider extends Document {
  name: string;
  monthlyQuota: number;
  usedQuota: number;
  supportedServices: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProviderSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    monthlyQuota: { type: Number, default: 10 },
    usedQuota: { type: Number, default: 0 },
    supportedServices: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  },
  { timestamps: true }
);

export const Provider: Model<IProvider> =
  mongoose.models.Provider || mongoose.model<IProvider>('Provider', ProviderSchema);
