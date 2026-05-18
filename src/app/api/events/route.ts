export const dynamic = 'force-dynamic';

import { sseEmitter } from '@/services/leadDistributor';

export async function GET(req: Request) {
  let responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  writer.write(encoder.encode('retry: 10000\n\n'));

  const sendEvent = () => {
    writer.write(encoder.encode('data: update\n\n'));
  };

  // When a lead is assigned or quota reset, send ping
  sseEmitter.on('update', sendEvent);

  req.signal.addEventListener('abort', () => {
    sseEmitter.off('update', sendEvent);
    writer.close();
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
