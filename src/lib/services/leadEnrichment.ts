import { OpenAI } from 'openai';
import { SignalType } from '@prisma/client';

let openai: OpenAI | null = null;

const getOpenAIClient = () => {
  if (openai) return openai;
  if (!process.env.OPENAI_API_KEY) return null;
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return openai;
};

export interface EnrichmentResult {
  industry?: string;
  companySize?: string;
  description?: string;
  relevantIsoNeed?: string;
  signals: {
    type: SignalType;
    description: string;
    confidence: number;
  }[];
}

export const enrichLeadWithAI = async (
  companyName: string,
  websiteContent: string
): Promise<EnrichmentResult> => {
  const client = getOpenAIClient();
  if (!client) {
    console.warn('OpenAI client could not be initialized. Skipping AI enrichment.');
    return { signals: [] };
  }

  const prompt = `
    Analyze the following website content for a company named "${companyName}".
    Extract and determine:
    1. Industry: Identify the primary industry (e.g., Construction, Manufacturing, IT Services, Healthcare).
    2. Company Size: Estimate employee count if possible (e.g., "10-50", "100-250", "500+").
    3. Business Description: A concise summary of their core business.
    4. Relevant ISO Needs: Based on their industry and services, which ISO certifications would be most beneficial? 
       (Options: ISO 9001, ISO 14001, ISO 45001, ISO 27001, ISO 22301, ISO 13485, etc.)
    5. Buying Signals: Detect specific indicators:
       - TENDER: Mentions of bidding, public sector contracts, or tender requirements.
       - HIRING: Recruitment for Quality, Compliance, HSE, InfoSec, or Operations roles.
       - KEYWORD: Presence of quality, safety, environment, or cybersecurity keywords.
       - GROWTH: Mentions of expansion, new facilities, or rapid growth.
       - COMPLIANCE_REQUIREMENT: Specific mentions of regulatory compliance needs or supplier standards.

    Return ONLY a JSON object:
    {
      "industry": "string",
      "companySize": "string",
      "description": "string",
      "relevantIsoNeed": "string",
      "signals": [
        {
          "type": "TENDER" | "HIRING" | "KEYWORD" | "GROWTH" | "COMPLIANCE_REQUIREMENT",
          "description": "Short explanation of why this signal was detected",
          "confidence": 0.0 to 1.0
        }
      ]
    }

    Website Content:
    ${websiteContent.substring(0, 5000)} // Truncate to save tokens
  `;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert business analyst for ISO consultancy lead generation.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) return { signals: [] };

    const result = JSON.parse(content);
    return result as EnrichmentResult;
  } catch (error) {
    console.error('Error enriching lead with AI:', error);
    return { signals: [] };
  }
};
