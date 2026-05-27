import { NextRequest, NextResponse } from 'next/server';
import { CampaignService } from '@/lib/services/campaign';

const campaignService = new CampaignService();

export async function GET() {
  try {
    const campaigns = await campaignService.getCampaigns();
    return NextResponse.json(campaigns);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const campaign = await campaignService.createCampaign(body);
    return NextResponse.json(campaign);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
