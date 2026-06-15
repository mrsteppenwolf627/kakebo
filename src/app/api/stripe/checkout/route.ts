import { NextResponse } from 'next/server';

// Stripe payments have been removed. Kakebo is now free.
export async function POST() {
    return new NextResponse('Payment processing has been removed. Kakebo is now free.', { status: 410 });
}
