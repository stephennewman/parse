import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Optionally set your DT signature secret here or via env
const DT_SIGNATURE_SECRET = process.env.DT_SIGNATURE_SECRET;

// Initialize Supabase client for server-side usage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Log headers and body for debugging
    const headers = Object.fromEntries(request.headers.entries());
    let event;
    try {
      event = await request.json();
    } catch (e) {
      console.error('Failed to parse JSON body:', e);
      event = null;
    }
    console.log('DT Webhook received (prod):', { headers, event });

    // Normalize DT payload structure
    let normalized = event;
    if (event?.event?.event && event?.event?.labels && event?.event?.metadata) {
      normalized = {
        event: event.event.event,
        labels: event.event.labels,
        metadata: event.event.metadata,
      };
    }

    // Optionally verify DT signature (if configured)
    if (DT_SIGNATURE_SECRET) {
      const signature = request.headers.get('x-dt-signature');
      // TODO: Implement signature verification logic here
    }

    // Extract fields from normalized DT Cloud payload
    const sensor_id = normalized?.metadata?.deviceId || null;
    const event_type = normalized?.event?.eventType || null;
    const event_value = { ...normalized?.event?.data };
    // Optionally add sensor_name to event_value
    if (normalized?.labels?.name) {
      event_value.sensor_name = normalized.labels.name;
    }
    const event_timestamp = normalized?.event?.timestamp || new Date().toISOString();

    if (!sensor_id || !event_type || !event_timestamp) {
      console.error('Missing required event fields:', { sensor_id, event_type, event_timestamp });
      return NextResponse.json({ error: 'Missing required event fields.' }, { status: 400 });
    }

    // Insert into Supabase
    const { error } = await supabase.from('sensor_events').insert({
      sensor_id,
      event_type,
      event_value,
      event_timestamp,
      raw_payload: normalized,
      // form_submission_id, user_id: can be added if mapping is needed
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to store event.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DT Webhook error:', err);
    return NextResponse.json({ error: 'Invalid request or server error.' }, { status: 500 });
  }
} 