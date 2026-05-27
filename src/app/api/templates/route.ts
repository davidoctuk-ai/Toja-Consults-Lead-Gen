import { NextRequest, NextResponse } from 'next/server';
import { TemplateService } from '@/lib/services/template';

const templateService = new TemplateService();

export async function GET() {
  try {
    const templates = await templateService.getTemplates();
    return NextResponse.json(templates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const template = await templateService.createTemplate(body);
    return NextResponse.json(template);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
