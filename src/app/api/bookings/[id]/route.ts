import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { lead: true }
    });

    // If booking is marked as COMPLETED, move lead to PROPOSAL_SENT stage
    if (status === 'COMPLETED') {
      await prisma.lead.update({
        where: { id: booking.leadId },
        data: { status: 'PROPOSAL_SENT' }
      });
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Optional: Also delete from Google Calendar if calendarEventId exists
    
    await prisma.booking.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
