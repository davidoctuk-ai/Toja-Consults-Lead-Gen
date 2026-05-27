import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
  try {
    const rule = await prisma.automationRule.findUnique({
      where: { id: id },
    });
    if (!rule) {
      return NextResponse.json({ error: 'Automation rule not found' }, { status: 404 });
    }
    return NextResponse.json(rule);
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
    const rule = await prisma.automationRule.update({
      where: { id: id },
      data: body,
    });
    return NextResponse.json(rule);
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
    await prisma.automationRule.delete({
      where: { id: id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
