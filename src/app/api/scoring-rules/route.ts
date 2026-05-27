import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rules = await prisma.scoringRule.findMany({
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
    const { name, description, points, criteria, isActive } = body;

    if (!name || points === undefined || !criteria) {
      return NextResponse.json({ error: 'Name, points, and criteria are required' }, { status: 400 });
    }

    const rule = await prisma.scoringRule.create({
      data: {
        name,
        description,
        points,
        criteria,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(rule);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
