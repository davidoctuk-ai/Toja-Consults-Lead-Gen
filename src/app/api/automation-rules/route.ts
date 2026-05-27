import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rules = await prisma.automationRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(rules);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, trigger, condition, action, actionData, isActive } = body;

    if (!name || !trigger || !condition || !action || !actionData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rule = await prisma.automationRule.create({
      data: {
        name,
        trigger,
        condition,
        action,
        actionData,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(rule);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
