import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { LeadAssignment } from '@/models/LeadAssignment';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    
    const assignments = await LeadAssignment.find({ providerId: id })
      .populate('leadId')
      .sort({ createdAt: -1 });

    const leads = assignments.map(a => a.leadId);

    return NextResponse.json(leads, { status: 200 });
  } catch (error) {
    console.error('Error fetching provider leads:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
