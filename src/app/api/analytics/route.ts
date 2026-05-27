import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const snapshots = await prisma.analyticsSnapshot.findMany({
      orderBy: {
        date: "asc",
      },
    });

    const campaignStats = await prisma.campaign.findMany({
      include: {
        _count: {
          select: {
            emails: true,
            leads: true,
          },
        },
        emails: {
          select: {
            status: true,
          },
        },
      },
    });

    // Format campaign stats for the frontend
    const formattedCampaignStats = campaignStats.map((campaign: any) => {
      const sent = campaign.emails.length;
      const opened = campaign.emails.filter((e: any) => ["OPENED", "CLICKED", "REPLIED"].includes(e.status)).length;
      const replied = campaign.emails.filter((e: any) => e.status === "REPLIED").length;

      return {
        name: campaign.name,
        sent: sent || 0,
        opened: opened || 0,
        replied: replied || 0,
      };
    });

    // Leads by Country breakdown
    const leads = await prisma.lead.findMany({
      select: {
        country: true,
      }
    });

    const countryCounts: Record<string, number> = {};
    leads.forEach(lead => {
      const country = lead.country || "Unknown";
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    const leadsByCountry = Object.entries(countryCounts).map(([name, count]) => ({
      name,
      count,
    })).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      snapshots,
      campaignStats: formattedCampaignStats,
      leadsByCountry,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
