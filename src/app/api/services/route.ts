import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Service } from '@/models/Service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const services = await Service.find({}).sort({ name: 1 });
    return NextResponse.json(services, { status: 200 });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
