import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
  try {
    const config = await prisma.scraperConfig.findUnique({
      where: { id: id },
    });
    if (!config) {
      return NextResponse.json({ error: 'Scraper config not found' }, { status: 404 });
    }
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
  try {
    const body = await req.json();
    const config = await prisma.scraperConfig.update({
      where: { id: id },
      data: body,
    });
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
  try {
    await prisma.scraperConfig.delete({
      where: { id: id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
