import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeadAssignment extends Document {
  leadId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LeadAssignmentSchema: Schema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
  },
  { timestamps: true }
);

// Prevent same provider assigned to the same lead twice
LeadAssignmentSchema.index({ leadId: 1, providerId: 1 }, { unique: true });

export const LeadAssignment: Model<ILeadAssignment> =
  mongoose.models.LeadAssignment ||
  mongoose.model<ILeadAssignment>('LeadAssignment', LeadAssignmentSchema);
