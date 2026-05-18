import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Provider } from '@/models/Provider';
import { WebhookEvent } from '@/models/WebhookEvent';
import { sseEmitter } from '@/services/leadDistributor';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    await dbConnect();

    // 1. Idempotency Check
    // We try to insert the eventId. If it already exists, the unique index throws an error or $setOnInsert returns null if we used findOneAndUpdate.
    // Using findOneAndUpdate with upsert: true and $setOnInsert ensures atomicity.
    const eventRecord = await WebhookEvent.findOneAndUpdate(
      { eventId },
      { $setOnInsert: { eventId, status: 'PROCESSED', processedAt: new Date() } },
      { upsert: true, returnDocument: 'before' } // returnDocument: 'before' means it returns the OLD document if it existed
    );

    // If eventRecord is NOT null, it means the document already existed, so we've already processed this.
    if (eventRecord) {
      console.log(`Webhook event ${eventId} already processed. Skipping.`);
      return NextResponse.json({ message: 'Event already processed idempotently' }, { status: 200 });
    }

    // 2. Reset Quotas
    await Provider.updateMany({}, { $set: { usedQuota: 0 } });

    // 3. Trigger Real-time update
    sseEmitter.emit('update');

    return NextResponse.json({ message: 'Quotas reset successfully' }, { status: 200 });
    
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
