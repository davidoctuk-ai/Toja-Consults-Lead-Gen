"use client"

import { useEffect, useState } from "react"
import { 
  BarChart3, 
  CheckCircle2, 
  Mail, 
  Target, 
  Users, 
  TrendingUp,
  Clock,
  Calendar,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch("/api/analytics")
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const snapshots = data?.snapshots || []
  const latestSnapshot = snapshots[snapshots.length - 1] || {
    leadsFound: 0,
    leadsEnriched: 0,
    hotLeads: 0,
    emailsSent: 0,
    callsBooked: 0,
    openRate: 0,
    replyRate: 0,
  }

  const previousSnapshot = snapshots[snapshots.length - 2] || latestSnapshot

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return "0"
    const change = ((current - previous) / previous * 100).toFixed(0)
    return change.startsWith("-") ? change : `+${change}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Toja Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back. Here's what's happening with your ISO lead generation campaigns.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Found</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSnapshot.leadsFound.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {calculateChange(latestSnapshot.leadsFound, previousSnapshot.leadsFound)}% from last period
            </p>
          </CardContent>
        </GlassCard>
        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <Target className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSnapshot.hotLeads}</div>
            <p className="text-xs text-muted-foreground">
              {calculateChange(latestSnapshot.hotLeads, previousSnapshot.hotLeads)}% growth
            </p>
          </CardContent>
        </GlassCard>
        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSnapshot.emailsSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {latestSnapshot.openRate}% avg open rate
            </p>
          </CardContent>
        </GlassCard>
        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Booked</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSnapshot.callsBooked}</div>
            <p className="text-xs text-muted-foreground">
              {calculateChange(latestSnapshot.callsBooked, previousSnapshot.callsBooked)}% this period
            </p>
          </CardContent>
        </GlassCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <GlassCard className="col-span-4" hover={false}>
          <CardHeader>
            <CardTitle>ISO Opportunity Signals</CardTitle>
            <CardDescription>Recent buying signals detected across the web.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  company: "BuildCorp Solutions",
                  signal: "Tender Requirement",
                  iso: "ISO 9001",
                  time: "2 hours ago",
                  score: 95,
                },
                {
                  company: "TechFlow Systems",
                  signal: "Hiring Quality Manager",
                  iso: "ISO 9001, 27001",
                  time: "5 hours ago",
                  score: 82,
                },
                {
                  company: "EcoLogistics Ltd",
                  signal: "Public Sector Bid",
                  iso: "ISO 14001",
                  time: "Yesterday",
                  score: 88,
                },
                {
                  company: "SecureNet IT",
                  signal: "Cybersecurity growth",
                  iso: "ISO 27001",
                  time: "Yesterday",
                  score: 91,
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-primary/5 pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-primary">{item.company}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold bg-secondary/5 text-secondary border-secondary/20">{item.signal}</Badge>
                      <span className="text-xs text-muted-foreground">{item.iso}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-bold text-secondary">
                      <TrendingUp className="h-3 w-3" />
                      <span>{item.score}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                      <Clock className="h-2 w-2" />
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </GlassCard>
        <GlassCard className="col-span-3" hover={false}>
          <CardHeader>
            <CardTitle>Recent Conversions</CardTitle>
            <CardDescription>Latest leads moved to "Interested".</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {[
                { name: "John Smith", company: "Apex Manufacturing", status: "Discovery Booked" },
                { name: "Sarah Chen", company: "CloudScale SaaS", status: "Interested" },
                { name: "Robert Taylor", company: "GreenEnergy UK", status: "Discovery Booked" },
                { name: "Michael Ross", company: "Ross Construction", status: "Interested" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shadow-inner">
                    {item.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.company}</p>
                  </div>
                  <Badge variant={item.status === "Interested" ? "secondary" : "default"} className="text-[10px] font-bold">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}

