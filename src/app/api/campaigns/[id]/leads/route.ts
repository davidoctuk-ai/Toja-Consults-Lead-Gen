import { NextRequest, NextResponse } from 'next/server';
import { CampaignService } from '@/lib/services/campaign';

const campaignService = new CampaignService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { leadIds } = await req.json();
    if (!leadIds || !Array.isArray(leadIds)) {
      return NextResponse.json({ error: 'leadIds array is required' }, { status: 400 });
    }
    const result = await campaignService.addLeadsToCampaign(id, leadIds);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
