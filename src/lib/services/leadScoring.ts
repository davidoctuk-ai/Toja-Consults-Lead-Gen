import { prisma } from '../prisma';
import { Lead, OpportunitySignal, SignalType, ScoringRule } from '@prisma/client';
import { AutomationService } from './automation';

export type LeadWithSignals = Lead & {
  signals: OpportunitySignal[];
};

export interface ScoringResult {
  score: number;
  breakdown: {
    ruleName: string;
    points: number;
  }[];
}

/**
 * Pure function to apply scoring rules to a lead.
 * Does not depend on a database.
 */
export const applyScoringRules = (
  lead: LeadWithSignals, 
  activeRules: ScoringRule[]
): ScoringResult => {
  let totalScore = 0;
  const breakdown: { ruleName: string; points: number }[] = [];

  // 1. Apply dynamic rules from parameters
  for (const rule of activeRules) {
    const criteria = rule.criteria as any;
    if (criteria && criteria.field && criteria.operator && criteria.value) {
      const fieldValue = (lead as any)[criteria.field];
      if (typeof fieldValue === 'string') {
        const match = criteria.operator === 'equals' 
          ? fieldValue.toLowerCase() === criteria.value.toLowerCase()
          : fieldValue.toLowerCase().includes(criteria.value.toLowerCase());
        
        if (match) {
          totalScore += rule.points;
          breakdown.push({ ruleName: rule.name, points: rule.points });
        }
      }
    }
  }

  // 2. Apply signal-based rules (Hardcoded for now as they are complex)
  lead.signals.forEach(signal => {
    switch (signal.type) {
      case 'TENDER':
        totalScore += 20;
        breakdown.push({ ruleName: 'Public Sector Tender Detected', points: 20 });
        break;
      case 'HIRING':
        if (/quality|compliance|hse|infosec|operations|audit/i.test(signal.description)) {
          totalScore += 20;
          breakdown.push({ ruleName: 'Relevant Role Hiring Detected', points: 20 });
        }
        break;
      case 'COMPLIANCE_REQUIREMENT':
        totalScore += 20;
        breakdown.push({ ruleName: 'Compliance Requirement Detected', points: 20 });
        break;
      case 'KEYWORD':
        if (/iso|quality assurance|safety|environment|cybersecurity|compliance/i.test(signal.description)) {
          totalScore += 15;
          breakdown.push({ ruleName: 'ISO Keyword Detected', points: 15 });
        }
        break;
    }
  });

  // 3. Company Size Scoring (+10 if 10-250 employees)
  if (lead.companySize) {
    const sizeMatch = lead.companySize.match(/(\d+)/g);
    if (sizeMatch) {
      const minSize = parseInt(sizeMatch[0]);
      const maxSize = sizeMatch[1] ? parseInt(sizeMatch[1]) : minSize;
      if (minSize >= 10 && maxSize <= 250) {
        totalScore += 10;
        breakdown.push({ ruleName: 'Ideal SME Size (10-250)', points: 10 });
      }
    }
  }

  // Cap score at 100
  const finalScore = Math.min(totalScore, 100);

  return { score: finalScore, breakdown };
};

/**
 * Database-dependent function to calculate and save lead score.
 */
export const calculateLeadScore = async (leadId: string): Promise<ScoringResult> => {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { signals: true },
  });

  if (!lead) {
    throw new Error('Lead not found');
  }

  const activeRules = await prisma.scoringRule.findMany({
    where: { isActive: true },
  });

  const result = applyScoringRules(lead, activeRules);

  // Update lead score in DB
  await prisma.lead.update({
    where: { id: leadId },
    data: { score: result.score },
  });

  // Trigger automation processing
  const automationService = new AutomationService();
  await automationService.evaluateLead(leadId);

  return result;
};

export const getLeadCategory = (score: number): 'HOT' | 'WARM' | 'COLD' => {
  if (score >= 70) return 'HOT';
  if (score >= 40) return 'WARM';
  return 'COLD';
};

/**
 * Seed basic rules if none exist
 */
export const seedDefaultScoringRules = async () => {
  const count = await prisma.scoringRule.count();
  if (count > 0) return;

  const defaultRules = [
    {
      name: 'Regulated Industry - Healthcare',
      description: 'Healthcare companies have heavy compliance requirements.',
      points: 25,
      criteria: { field: 'industry', operator: 'contains', value: 'Healthcare' },
    },
    {
      name: 'Regulated Industry - Finance',
      description: 'Finance and Banking have heavy compliance requirements.',
      points: 25,
      criteria: { field: 'industry', operator: 'contains', value: 'Finance' },
    },
    {
      name: 'Regulated Industry - Aerospace',
      description: 'Aerospace and Defense have heavy compliance requirements.',
      points: 25,
      criteria: { field: 'industry', operator: 'contains', value: 'Aerospace' },
    },
    {
      name: 'Target Industry - Construction',
      description: 'Construction companies are prime targets for ISO 9001, 14001, 45001.',
      points: 10,
      criteria: { field: 'industry', operator: 'contains', value: 'Construction' },
    },
    {
      name: 'Target Industry - Manufacturing',
      description: 'Manufacturing companies are prime targets for ISO 9001 and 14001.',
      points: 10,
      criteria: { field: 'industry', operator: 'contains', value: 'Manufacturing' },
    },
    {
      name: 'Target Industry - IT & SaaS',
      description: 'IT companies are prime targets for ISO 27001 and 20000.',
      points: 10,
      criteria: { field: 'industry', operator: 'contains', value: 'IT' },
    },
    {
      name: 'Target Industry - Logistics',
      description: 'Logistics companies are prime targets for ISO 9001 and 28000.',
      points: 10,
      criteria: { field: 'industry', operator: 'contains', value: 'Logistics' },
    },
    {
      name: 'Target Industry - Engineering',
      description: 'Engineering firms are prime targets for ISO 9001.',
      points: 10,
      criteria: { field: 'industry', operator: 'contains', value: 'Engineering' },
    }
  ];

  for (const rule of defaultRules) {
    await prisma.scoringRule.create({ data: rule });
  }
};
