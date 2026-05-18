import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { distributeLead } from '@/services/leadDistributor';
import { z } from 'zod';

const leadSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  phone: z.string().min(10, "Phone number is too short"),
  city: z.string().min(2, "City is too short"),
  serviceId: z.string().length(24, "Invalid Service ID"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await dbConnect();

    // Call the distributor
    const result = await distributeLead(parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 409 });
    }

    return NextResponse.json({
      message: result.message,
      leadId: result.leadId,
      assignedProviders: result.assignedProviders,
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('API Error /leads:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
