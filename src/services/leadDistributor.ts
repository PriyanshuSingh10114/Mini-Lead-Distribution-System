import mongoose from 'mongoose';
import { Lead } from '../models/Lead';
import { LeadAssignment } from '../models/LeadAssignment';
import { Provider } from '../models/Provider';
import { Service } from '../models/Service';
import { AllocationState } from '../models/AllocationState';
import { EventEmitter } from 'events';

// In Next.js App Router, global variables survive hot reloads
const globalAny = global as any;
if (!globalAny.sseEmitter) {
  globalAny.sseEmitter = new EventEmitter();
}
export const sseEmitter: EventEmitter = globalAny.sseEmitter;

interface DistributorResult {
  success: boolean;
  message: string;
  leadId?: mongoose.Types.ObjectId;
  assignedProviders?: string[];
}

export async function distributeLead(
  leadData: { name: string; phone: string; city: string; serviceId: string }
): Promise<DistributorResult> {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    // 1. Check if Lead already exists (Concurrency safe with unique index, but we check here too for friendly error)
    const existingLead = await Lead.findOne({ phone: leadData.phone, serviceId: leadData.serviceId }).session(session);
    if (existingLead) {
      await session.abortTransaction();
      return { success: false, message: 'Duplicate lead: A lead with this phone number already exists for this service.' };
    }

    // 2. Fetch the service to know its name
    const service = await Service.findById(leadData.serviceId).session(session);
    if (!service) {
      await session.abortTransaction();
      return { success: false, message: 'Service not found.' };
    }

    // 3. Define the rules based on Service name
    let mandatoryNames: string[] = [];
    let fairPoolNames: string[] = [];

    if (service.name === 'Service 1') {
      mandatoryNames = ['Provider 1'];
      fairPoolNames = ['Provider 2', 'Provider 3', 'Provider 4'];
    } else if (service.name === 'Service 2') {
      mandatoryNames = ['Provider 5'];
      fairPoolNames = ['Provider 6', 'Provider 7', 'Provider 8'];
    } else if (service.name === 'Service 3') {
      mandatoryNames = ['Provider 1', 'Provider 4'];
      fairPoolNames = ['Provider 2', 'Provider 3', 'Provider 5', 'Provider 6', 'Provider 7', 'Provider 8'];
    } else {
      // Fallback
      const allProviders = await Provider.find({}).session(session);
      fairPoolNames = allProviders.map(p => p.name);
    }

    // 4. Create the Lead
    const [newLead] = await Lead.create([leadData], { session });

    // 5. Track assignments
    const assignedProviderIds: mongoose.Types.ObjectId[] = [];
    const assignedProviderNames: string[] = [];

    // Helper to atomically assign a provider by name
    const tryAssignProvider = async (providerName: string) => {
      // Atomic check and increment quota
      const provider = await Provider.findOneAndUpdate(
        { 
          name: providerName, 
          $expr: { $lt: ['$usedQuota', '$monthlyQuota'] } 
        },
        { $inc: { usedQuota: 1 } },
        { new: true, session }
      );

      if (provider) {
        assignedProviderIds.push(provider._id as mongoose.Types.ObjectId);
        assignedProviderNames.push(provider.name);
        return true;
      }
      return false;
    };

    // 6. Assign Mandatory Providers
    for (const pName of mandatoryNames) {
      if (assignedProviderIds.length < 3) {
        await tryAssignProvider(pName);
      }
    }

    // 7. Assign Fair Pool Providers using Rotating Cursor (Round Robin)
    const remainingSlots = 3 - assignedProviderIds.length;
    if (remainingSlots > 0 && fairPoolNames.length > 0) {
      // Atomically increment the cursor to get our starting position
      const allocationState = await AllocationState.findOneAndUpdate(
        { serviceId: service._id },
        { $inc: { currentIndex: 1 } },
        { new: true, upsert: true, session }
      );

      const startIndex = allocationState!.currentIndex;
      
      // We will loop through the fair pool, starting at startIndex
      // We try each provider at most once until we fill the slots
      let slotsToFill = remainingSlots;
      let poolAttempts = 0;
      const poolSize = fairPoolNames.length;

      while (slotsToFill > 0 && poolAttempts < poolSize) {
        const checkIndex = (startIndex + poolAttempts) % poolSize;
        const candidateName = fairPoolNames[checkIndex];
        
        // Ensure we don't assign the same provider twice
        if (!assignedProviderNames.includes(candidateName)) {
          const assigned = await tryAssignProvider(candidateName);
          if (assigned) {
            slotsToFill--;
          }
        }
        poolAttempts++;
      }
    }

    // 8. Create Assignments Records
    if (assignedProviderIds.length > 0) {
      const assignmentDocs = assignedProviderIds.map((providerId) => ({
        leadId: newLead._id,
        providerId
      }));
      await LeadAssignment.insertMany(assignmentDocs, { session });
    }

    await session.commitTransaction();

    // Trigger SSE real-time update
    sseEmitter.emit('update');

    return { 
      success: true, 
      message: 'Lead distributed successfully.',
      leadId: newLead._id as mongoose.Types.ObjectId,
      assignedProviders: assignedProviderNames
    };

  } catch (error: any) {
    await session.abortTransaction();
    if (error.code === 11000) {
      return { success: false, message: 'Duplicate lead: A lead with this phone number already exists for this service.' };
    }
    console.error('Lead distribution transaction failed:', error);
    return { success: false, message: 'Internal server error during lead distribution.' };
  } finally {
    session.endSession();
  }
}
