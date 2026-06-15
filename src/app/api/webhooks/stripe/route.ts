import { NextResponse } from 'next/server';

// Stripe webhooks have been removed. Kakebo is now free.
export async function POST() {
    return new NextResponse(null, { status: 200 });
}
