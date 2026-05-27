import { prisma } from '../prisma';
import { enrichLeadWithAI } from './leadEnrichment';
import { calculateLeadScore } from './leadScoring';

export class LeadProcessor {
  /**
   * Processes a single lead: enriches it with AI and then scores it.
   */
  async processLead(leadId: string, websiteContent?: string) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) throw new Error('Lead not found');

    console.log(`Processing lead: ${lead.companyName} (${leadId})`);

    // 1. Enrich with AI if website content is provided
    if (websiteContent) {
      const enrichment = await enrichLeadWithAI(lead.companyName, websiteContent);

      // Save signals
      if (enrichment.signals && enrichment.signals.length > 0) {
        // Clear old signals first
        await prisma.opportunitySignal.deleteMany({
          where: { leadId: leadId },
        });

        await prisma.opportunitySignal.createMany({
          data: enrichment.signals.map(s => ({
            leadId: leadId,
            type: s.type,
            description: s.description,
            confidence: s.confidence,
          })),
        });
      }

      // Update lead details
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          industry: enrichment.industry || lead.industry,
          companySize: enrichment.companySize || lead.companySize,
          description: enrichment.description || lead.description,
          relevantIsoNeed: enrichment.relevantIsoNeed || lead.relevantIsoNeed,
          status: 'ENRICHED',
        },
      });
    }

    // 2. Calculate score
    const scoringResult = await calculateLeadScore(leadId);

    // 3. Final lead update with score
    const updatedLead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { signals: true },
    });

    return {
      lead: updatedLead,
      scoring: scoringResult,
    };
  }
}
