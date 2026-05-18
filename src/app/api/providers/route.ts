import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Provider } from '@/models/Provider';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    // Use aggregation to fetch providers and count their assigned leads
    const providers = await Provider.aggregate([
      {
        $lookup: {
          from: 'leadassignments',
          localField: '_id',
          foreignField: 'providerId',
          as: 'assignments'
        }
      },
      {
        $addFields: {
          assignedLeadsCount: { $size: '$assignments' }
        }
      },
      {
        $project: {
          assignments: 0 // Remove the large array to keep response small
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    return NextResponse.json(providers, { status: 200 });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
