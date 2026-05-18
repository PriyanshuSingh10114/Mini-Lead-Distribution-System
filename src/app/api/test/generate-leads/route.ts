import { NextResponse } from 'next/server';
import { distributeLead } from '@/services/leadDistributor';
import dbConnect from '@/lib/mongoose';
import { Service } from '@/models/Service';

export async function POST(req: Request) {
  try {
    const { count = 10, concurrent = true } = await req.json().catch(() => ({}));

    await dbConnect();
    const services = await Service.find({});
    
    if (services.length === 0) {
      return NextResponse.json({ error: 'No services found' }, { status: 400 });
    }

    const generateRandomLead = () => {
      const randomService = services[Math.floor(Math.random() * services.length)];
      const randomId = Math.random().toString().substring(2, 10);
      return {
        name: `Test User ${randomId}`,
        phone: `99${randomId}`, // Ensure unique phone
        city: 'Test City',
        serviceId: randomService._id.toString()
      };
    };

    const leads = Array.from({ length: count }).map(generateRandomLead);

    if (concurrent) {
      // Execute all at once to test race conditions
      const results = await Promise.allSettled(leads.map(lead => distributeLead(lead)));
      return NextResponse.json({ message: `Simulated ${count} concurrent leads`, results }, { status: 200 });
    } else {
      const results = [];
      for (const lead of leads) {
        results.push(await distributeLead(lead));
      }
      return NextResponse.json({ message: `Simulated ${count} sequential leads`, results }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Test API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
