import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Generate a unique event ID or use one from request
    const body = await req.json().catch(() => ({}));
    const eventId = body.eventId || `test-reset-${Date.now()}`;

    // Internally call the webhook to reuse the exact logic
    // We construct an absolute URL because fetch in Next.js requires it
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host');
    
    const webhookUrl = `${protocol}://${host}/api/webhooks/subscription-renewed`;

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ eventId })
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Test API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
