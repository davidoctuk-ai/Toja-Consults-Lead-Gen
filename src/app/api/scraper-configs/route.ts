import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const configs = await prisma.scraperConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(configs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, config, interval, isActive } = body;

    if (!name || !type || !config) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const scraperConfig = await prisma.scraperConfig.create({
      data: {
        name,
        type,
        config,
        interval,
        isActive: isActive !== undefined ? isActive : true,
        nextRunAt: new Date(), // Run immediately if active
      },
    });

    return NextResponse.json(scraperConfig);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
