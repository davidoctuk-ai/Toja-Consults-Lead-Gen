const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const template1 = await prisma.emailTemplate.upsert({
    where: { id: 'iso-9001-intro' },
    update: {},
    create: {
      id: 'iso-9001-intro',
      name: 'ISO 9001 Introduction',
      subject: 'ISO 9001 Certification Support for {{company_name}}',
      body: 'Hi {{first_name}},\n\nI noticed {{company_name}} works in {{industry}} and may need strong compliance credentials for supplier approval or tender requirements.\n\nToja Consultancy helps businesses prepare for ISO 9001 certification with gap assessments, documentation, and audit support.\n\nWould you be open to a quick discovery call?\n\nBest regards,\nToja Team',
    },
  })

  const template2 = await prisma.emailTemplate.upsert({
    where: { id: 'iso-27001-readiness' },
    update: {},
    create: {
      id: 'iso-27001-readiness',
      name: 'ISO 27001 Readiness',
      subject: 'Securing {{company_name}} with ISO 27001',
      body: 'Hi {{first_name}},\n\nWith the increasing focus on information security in the {{industry}} sector, many companies are looking at ISO 27001.\n\nToja Consultancy provides specialized consultancy to help you achieve readiness quickly.\n\nBest regards,\nToja Team',
    },
  })

  const snapshots = await Promise.all([
    prisma.analyticsSnapshot.create({
      data: {
        date: new Date(new Date().setDate(new Date().getDate() - 30)),
        leadsFound: 120,
        leadsEnriched: 100,
        hotLeads: 25,
        emailsSent: 80,
        openRate: 42.5,
        replyRate: 12.0,
        callsBooked: 5,
        proposalsSent: 2,
        revenueForecast: 15000,
      },
    }),
    prisma.analyticsSnapshot.create({
      data: {
        date: new Date(new Date().setDate(new Date().getDate() - 15)),
        leadsFound: 250,
        leadsEnriched: 210,
        hotLeads: 55,
        emailsSent: 180,
        openRate: 44.8,
        replyRate: 14.2,
        callsBooked: 12,
        proposalsSent: 5,
        revenueForecast: 35000,
      },
    }),
    prisma.analyticsSnapshot.create({
      data: {
        date: new Date(),
        leadsFound: 450,
        leadsEnriched: 380,
        hotLeads: 95,
        emailsSent: 320,
        openRate: 48.2,
        replyRate: 15.5,
        callsBooked: 24,
        proposalsSent: 10,
        revenueForecast: 75000,
      },
    }),
  ])

  console.log({ template1, template2, snapshotsCount: snapshots.length })

  const sampleLeads = await Promise.all([
    prisma.lead.upsert({
      where: { decisionMakerEmail: 'j.wilson@buildcorp.example.com' },
      update: {},
      create: {
        companyName: 'BuildCorp Solutions',
        website: 'https://buildcorp.example.com',
        industry: 'Construction',
        location: 'London',
        country: 'United Kingdom',
        companySize: '50-100',
        score: 95,
        status: 'INTERESTED',
        relevantIsoNeed: 'ISO 9001',
        decisionMakerName: 'James Wilson',
        decisionMakerEmail: 'j.wilson@buildcorp.example.com',
      },
    }),
    prisma.lead.upsert({
      where: { decisionMakerEmail: 'sarah@techflow.example.com' },
      update: {},
      create: {
        companyName: 'TechFlow Systems',
        website: 'https://techflow.example.com',
        industry: 'IT & SaaS',
        location: 'Manchester',
        country: 'United Kingdom',
        companySize: '10-50',
        score: 82,
        status: 'NEW',
        relevantIsoNeed: 'ISO 27001',
        decisionMakerName: 'Sarah Chen',
        decisionMakerEmail: 'sarah@techflow.example.com',
      },
    }),
    prisma.lead.upsert({
      where: { decisionMakerEmail: 'e.davis@securenet.example.com' },
      update: {},
      create: {
        companyName: 'SecureNet IT',
        website: 'https://securenet.example.com',
        industry: 'IT & SaaS',
        location: 'New York',
        country: 'USA',
        companySize: '25-50',
        score: 91,
        status: 'PROPOSAL_SENT',
        relevantIsoNeed: 'ISO 27001',
        decisionMakerName: 'Emily Davis',
        decisionMakerEmail: 'e.davis@securenet.example.com',
      },
    }),
    prisma.lead.upsert({
      where: { decisionMakerEmail: 'm.ross@medsupply.example.com' },
      update: {},
      create: {
        companyName: 'MedSupply Hub',
        website: 'https://medsupply.example.com',
        industry: 'Healthcare',
        location: 'Berlin',
        country: 'Germany',
        companySize: '150-300',
        score: 75,
        status: 'ENRICHED',
        relevantIsoNeed: 'ISO 13485',
        decisionMakerName: 'Michael Ross',
        decisionMakerEmail: 'm.ross@medsupply.example.com',
      },
    }),
  ])

  console.log({ leadsCount: sampleLeads.length })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
