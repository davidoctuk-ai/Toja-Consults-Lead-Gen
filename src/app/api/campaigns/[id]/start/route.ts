import { NextRequest, NextResponse } from 'next/server';
import { CampaignService } from '@/lib/services/campaign';

const campaignService = new CampaignService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await campaignService.startCampaign(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
