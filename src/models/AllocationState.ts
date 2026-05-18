import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAllocationState extends Document {
  serviceId: mongoose.Types.ObjectId;
  currentIndex: number;
}

const AllocationStateSchema: Schema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, unique: true },
    currentIndex: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AllocationState: Model<IAllocationState> =
  mongoose.models.AllocationState ||
  mongoose.model<IAllocationState>('AllocationState', AllocationStateSchema);
