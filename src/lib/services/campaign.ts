import { prisma } from '../prisma';
import { CampaignStatus, LeadStatus } from '@prisma/client';

export class CampaignService {
  async createCampaign(data: { name: string; description?: string; templateId?: string }) {
    return prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        templateId: data.templateId,
        status: 'DRAFT',
      },
    });
  }

  async getCampaigns() {
    return prisma.campaign.findMany({
      include: {
        template: true,
        _count: {
          select: { leads: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaignById(id: string) {
    return prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
        leads: {
          include: {
            lead: true,
          },
        },
      },
    });
  }

  async addLeadsToCampaign(campaignId: string, leadIds: string[]) {
    const campaignLeads = leadIds.map((leadId) => ({
      campaignId,
      leadId,
    }));

    return prisma.campaignLead.createMany({
      data: campaignLeads,
      skipDuplicates: true,
    });
  }

  async startCampaign(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        template: true,
        leads: {
          where: { status: 'PENDING' },
          include: { lead: true },
        },
      },
    });

    if (!campaign || !campaign.template) {
      throw new Error('Campaign or template not found');
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE' },
    });

    // Queue emails for leads
    const outreachEmails = campaign.leads.map((cl) => {
      let body = campaign.template!.body;
      const lead = cl.lead;
      
      // Personalize body (basic placeholder replacement)
      body = body.replace(/{{company_name}}/g, lead.companyName || '');
      body = body.replace(/{{first_name}}/g, lead.decisionMakerName?.split(' ')[0] || 'there');
      body = body.replace(/{{industry}}/g, lead.industry || '');

      return {
        campaignId,
        leadId: cl.leadId,
        subject: campaign.template!.subject,
        body,
        status: 'QUEUED' as const,
      };
    });

    if (outreachEmails.length > 0) {
      await prisma.outreachEmail.createMany({
        data: outreachEmails,
      });

      // Update CampaignLead status to indicate emails are queued/sent
      await prisma.campaignLead.updateMany({
        where: {
          campaignId,
          leadId: { in: campaign.leads.map(l => l.leadId) }
        },
        data: { status: 'ENQUEUED' }
      });
    }

    return { message: `Started campaign and queued ${outreachEmails.length} emails` };
  }
}
