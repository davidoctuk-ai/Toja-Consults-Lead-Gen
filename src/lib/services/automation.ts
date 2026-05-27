import { prisma } from '../prisma';
import { AutomationRule, Lead, LeadStatus } from '@prisma/client';
import { CampaignService } from './campaign';

export class AutomationService {
  private campaignService: CampaignService;

  constructor() {
    this.campaignService = new CampaignService();
  }

  /**
   * Process all active automation rules for a given lead
   */
  async evaluateLead(leadId: string) {
    let lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) return;

    // Process score triggers
    await this.processScoreTriggers(lead);

    // Re-fetch lead in case score triggers changed the status or other fields
    lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) return;

    // Process status triggers
    await this.processStatusTriggers(lead);
  }

  /**
   * Process rules triggered by score threshold
   */
  async processScoreTriggers(lead: Lead) {
    const rules = await prisma.automationRule.findMany({
      where: { 
        isActive: true,
        trigger: 'SCORE_THRESHOLD'
      },
    });

    for (const rule of rules) {
      const condition = rule.condition as any;
      if (condition && typeof condition.minScore === 'number') {
        if (lead.score >= condition.minScore) {
          await this.executeAction(rule, lead);
        }
      }
    }
  }

  /**
   * Process rules triggered by status change
   */
  async processStatusTriggers(lead: Lead) {
    const rules = await prisma.automationRule.findMany({
      where: { 
        isActive: true,
        trigger: 'STATUS_CHANGE'
      },
    });

    for (const rule of rules) {
      const condition = rule.condition as any;
      if (condition && condition.status === lead.status) {
        await this.executeAction(rule, lead);
      }
    }
  }

  /**
   * Execute the action defined in the automation rule
   */
  private async executeAction(rule: AutomationRule, lead: Lead) {
    // Prevent duplicate actions (e.g., adding to the same campaign twice)
    // For now, we rely on the specific action implementations to handle idempotency
    
    const actionData = rule.actionData as any;

    try {
      switch (rule.action) {
        case 'ADD_TO_CAMPAIGN':
          if (actionData && actionData.campaignId) {
            // Check if already in campaign to avoid unnecessary DB calls
            const existing = await prisma.campaignLead.findUnique({
              where: {
                campaignId_leadId: {
                  campaignId: actionData.campaignId,
                  leadId: lead.id,
                }
              }
            });

            if (!existing) {
              await this.campaignService.addLeadsToCampaign(actionData.campaignId, [lead.id]);
              console.log(`[AutomationService] Lead ${lead.id} automatically added to campaign ${actionData.campaignId} via rule "${rule.name}"`);
            }
          }
          break;
        
        case 'CHANGE_STATUS':
          if (actionData && actionData.newStatus) {
            if (lead.status !== actionData.newStatus) {
              await prisma.lead.update({
                where: { id: lead.id },
                data: { status: actionData.newStatus as LeadStatus },
              });
              console.log(`[AutomationService] Lead ${lead.id} status automatically changed to ${actionData.newStatus} via rule "${rule.name}"`);
            }
          }
          break;

        default:
          console.warn(`[AutomationService] Unknown action: ${rule.action}`);
      }
    } catch (error) {
      console.error(`[AutomationService] Error executing action for rule ${rule.id}:`, error);
    }
  }

  /**
   * Seed some default automation rules
   */
  static async seedDefaultRules() {
    const count = await prisma.automationRule.count();
    if (count > 0) return;

    // Find a default campaign to link to (or create one)
    let defaultCampaign = await prisma.campaign.findFirst();
    if (!defaultCampaign) {
      defaultCampaign = await prisma.campaign.create({
        data: {
          name: 'Hot Leads Outreach',
          description: 'Automatically added high-scoring leads',
          status: 'ACTIVE',
        }
      });
    }

    await prisma.automationRule.createMany({
      data: [
        {
          name: 'Auto-add Hot Leads to Outreach',
          trigger: 'SCORE_THRESHOLD',
          condition: { minScore: 80 },
          action: 'ADD_TO_CAMPAIGN',
          actionData: { campaignId: defaultCampaign.id },
        },
        {
          name: 'Auto-mark as Enriched on Score > 20',
          trigger: 'SCORE_THRESHOLD',
          condition: { minScore: 20 },
          action: 'CHANGE_STATUS',
          actionData: { newStatus: 'ENRICHED' },
        }
      ]
    });
    
    console.log('[AutomationService] Default automation rules seeded.');
  }
}
