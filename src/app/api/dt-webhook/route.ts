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
    // Parse incoming JSON
    const event = await request.json();

    // Optionally verify DT signature (if configured)
    if (DT_SIGNATURE_SECRET) {
      const signature = request.headers.get('x-dt-signature');
      // TODO: Implement signature verification logic here
      // If verification fails:
      // return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Extract relevant fields (customize as needed)
    const sensor_id = event?.device?.id || event?.sensor_id || null;
    const event_type = event?.eventType || event?.type || null;
    const event_value = event?.data || null;
    const event_timestamp = event?.timestamp || event?.event_timestamp || new Date().toISOString();

    if (!sensor_id || !event_type || !event_timestamp) {
      return NextResponse.json({ error: 'Missing required event fields.' }, { status: 400 });
    }

    // Insert into Supabase
    const { error } = await supabase.from('sensor_events').insert({
      sensor_id,
      event_type,
      event_value,
      event_timestamp,
      raw_payload: event,
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