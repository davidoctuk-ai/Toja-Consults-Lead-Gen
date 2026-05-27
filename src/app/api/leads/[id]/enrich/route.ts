import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeadProcessor } from '@/lib/services/leadProcessor';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { websiteContent } = await req.json();

    const processor = new LeadProcessor();
    const result = await processor.processLead(id, websiteContent);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error enriching lead:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
