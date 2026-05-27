import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/lib/services/booking';

export async function GET() {
  try {
    const bookings = await bookingService.getBookings();
    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, startTime, endTime } = body;

    if (!leadId || !startTime) {
      return NextResponse.json({ error: 'leadId and startTime are required' }, { status: 400 });
    }

    const booking = await bookingService.createBooking(
      leadId,
      new Date(startTime),
      endTime ? new Date(endTime) : undefined
    );

    return NextResponse.json(booking);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
