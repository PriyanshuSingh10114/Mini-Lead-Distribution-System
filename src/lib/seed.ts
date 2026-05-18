import dbConnect from './mongoose';
import { Service } from '../models/Service';
import { Provider } from '../models/Provider';
import { AllocationState } from '../models/AllocationState';

export async function seedDatabase() {
  await dbConnect();

  const serviceCount = await Service.countDocuments();
  if (serviceCount > 0) {
    // Already seeded
    return;
  }

  console.log('Seeding database...');

  // Create Services
  const services = [
    { name: 'Service 1' },
    { name: 'Service 2' },
    { name: 'Service 3' },
  ];

  const createdServices = await Service.insertMany(services);

  // Create Providers
  const providers = Array.from({ length: 8 }).map((_, i) => ({
    name: `Provider ${i + 1}`,
    monthlyQuota: 10,
    usedQuota: 0,
    supportedServices: createdServices.map((s) => s._id), // all support all for simplicity
  }));

  await Provider.insertMany(providers);

  // Initialize Allocation States for round-robin
  const allocationStates = createdServices.map((s) => ({
    serviceId: s._id,
    currentIndex: 0,
  }));

  await AllocationState.insertMany(allocationStates);

  console.log('Database seeded successfully.');
}
