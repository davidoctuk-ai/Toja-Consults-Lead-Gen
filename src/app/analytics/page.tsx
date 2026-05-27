"use client"

import { useEffect, useState } from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from "recharts"
import { 
  BarChart3, 
  Users, 
  Mail, 
  Target, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  DollarSign,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"

export default function AnalyticsPage() {
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
  const campaignStats = data?.campaignStats || []
  const leadsByCountry = data?.leadsByCountry || []
  
  // Use the latest snapshot for KPIs
  const latestSnapshot = snapshots[snapshots.length - 1] || {
    leadsFound: 0,
    leadsEnriched: 0,
    hotLeads: 0,
    emailsSent: 0,
    openRate: 0,
    replyRate: 0,
    callsBooked: 0,
    proposalsSent: 0,
    revenueForecast: 0
  }

  const previousSnapshot = snapshots[snapshots.length - 2] || latestSnapshot

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return "0.0"
    return ((current - previous) / previous * 100).toFixed(1)
  }

  const leadGrowth = snapshots.map((s: any) => ({
    date: s.date,
    leads: s.leadsFound,
    enriched: s.leadsEnriched,
    emails: s.emailsSent
  }))

  const chartConfig = {
    leads: {
      label: "Leads Found",
      color: "hsl(var(--primary))",
    },
    enriched: {
      label: "Leads Enriched",
      color: "hsl(var(--secondary))",
    },
    emails: {
      label: "Emails Sent",
      color: "oklch(0.577 0.245 27.325)",
    },
    sent: {
      label: "Sent",
      color: "hsl(var(--primary))",
    },
    opened: {
      label: "Opened",
      color: "hsl(var(--secondary))",
    },
    replied: {
      label: "Replied",
      color: "oklch(0.577 0.245 27.325)",
    },
    country: {
      label: "Leads",
      color: "hsl(var(--secondary))",
    },
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Performance metrics and lead generation insights.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Found</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSnapshot.leadsFound.toLocaleString()}</div>
            <div className="flex items-center pt-1">
              <ArrowUpRight className="h-3 w-3 text-secondary mr-1" />
              <span className="text-xs font-medium text-secondary">
                +{calculateChange(latestSnapshot.leadsFound, previousSnapshot.leadsFound)}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Enriched</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSnapshot.leadsEnriched.toLocaleString()}</div>
            <div className="flex items-center pt-1">
              <ArrowUpRight className="h-3 w-3 text-secondary mr-1" />
              <span className="text-xs font-medium text-secondary">
                +{calculateChange(latestSnapshot.leadsEnriched, previousSnapshot.leadsEnriched)}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">enrichment rate</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <Target className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSnapshot.hotLeads}</div>
            <div className="flex items-center pt-1">
              <ArrowUpRight className="h-3 w-3 text-secondary mr-1" />
              <span className="text-xs font-medium text-secondary">
                +{calculateChange(latestSnapshot.hotLeads, previousSnapshot.hotLeads)}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">conversion signal</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Forecast</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${latestSnapshot.revenueForecast.toLocaleString()}</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-muted-foreground">Based on current pipeline</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSnapshot.emailsSent.toLocaleString()}</div>
            <div className="flex items-center pt-1">
              <ArrowUpRight className="h-3 w-3 text-secondary mr-1" />
              <span className="text-xs font-medium text-secondary">
                +{calculateChange(latestSnapshot.emailsSent, previousSnapshot.emailsSent)}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">outreach volume</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSnapshot.openRate}%</div>
            <div className="flex items-center pt-1">
              <ArrowUpRight className="h-3 w-3 text-secondary mr-1" />
              <span className="text-xs font-medium text-secondary">
                +{calculateChange(latestSnapshot.openRate, previousSnapshot.openRate)}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">industry standard 45%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSnapshot.replyRate}%</div>
            <div className="flex items-center pt-1">
              <ArrowUpRight className="h-3 w-3 text-secondary mr-1" />
              <span className="text-xs font-medium text-secondary">
                +{calculateChange(latestSnapshot.replyRate, previousSnapshot.replyRate)}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">engagement rate</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Booked</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSnapshot.callsBooked}</div>
            <div className="flex items-center pt-1">
              <ArrowUpRight className="h-3 w-3 text-secondary mr-1" />
              <span className="text-xs font-medium text-secondary">
                +{calculateChange(latestSnapshot.callsBooked, previousSnapshot.callsBooked)}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">qualified leads</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Discovery & Outreach Growth</CardTitle>
            <CardDescription>Leads found, enriched, and emails sent over time.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={leadGrowth}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-leads)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--color-leads)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEnriched" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-enriched)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--color-enriched)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-emails)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--color-emails)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  className="text-[10px] text-muted-foreground"
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  className="text-[10px] text-muted-foreground"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="var(--color-leads)" 
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="enriched" 
                  stroke="var(--color-enriched)" 
                  fillOpacity={1} 
                  fill="url(#colorEnriched)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="emails" 
                  stroke="var(--color-emails)" 
                  fillOpacity={1} 
                  fill="url(#colorEmails)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Leads by Country</CardTitle>
            <CardDescription>Distribution of identified leads by geographic region.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={leadsByCountry} layout="vertical">
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" axisLine={false} tickLine={false} className="text-[10px] text-muted-foreground" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  className="text-[10px] text-muted-foreground"
                  width={100}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-country)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>Campaign Comparison</CardTitle>
            <CardDescription>Sent vs Opened per campaign.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={campaignStats}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  className="text-[10px] text-muted-foreground"
                />
                <YAxis axisLine={false} tickLine={false} className="text-[10px] text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sent" fill="var(--color-sent)" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="opened" fill="var(--color-opened)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Campaign Performance</CardTitle>
          <CardDescription>Breakdown of outreach metrics across all active campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead className="text-right">Emails Sent</TableHead>
                <TableHead className="text-right">Open Rate</TableHead>
                <TableHead className="text-right">Reply Rate</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaignStats.map((campaign: { name: string, sent: number, opened: number, replied: number }) => (
                <TableRow key={campaign.name}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell className="text-right">{campaign.sent}</TableCell>
                  <TableCell className="text-right">
                    {((campaign.opened / campaign.sent) * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right text-secondary font-medium">
                    {((campaign.replied / campaign.sent) * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-secondary" />
                      {campaign.replied}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
