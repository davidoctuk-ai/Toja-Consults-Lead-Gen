import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AutomationService } from '@/lib/services/automation';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: body,
    });

    // Trigger automation processing
    const automationService = new AutomationService();
    await automationService.evaluateLead(id);

    return NextResponse.json(updatedLead);
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.lead.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
