"use client"

import * as React from "react"
import { 
  Building2, 
  ExternalLink, 
  Filter, 
  LayoutGrid, 
  List, 
  Mail, 
  MoreHorizontal, 
  Phone, 
  Search, 
  Target,
  TrendingUp,
  User,
  Users,
  X,
  Globe,
  Zap,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { industries } from "@/lib/mock-data"

export default function LeadsPage() {
  const [leads, setLeads] = React.useState<any[]>([])
  const [filteredLeads, setFilteredLeads] = React.useState<any[]>([])
  const [selectedLead, setSelectedLead] = React.useState<any | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<"list" | "grid" | "grouped">("list")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isEnriching, setIsEnriching] = React.useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [industryFilter, setIndustryFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [countryFilter, setCountryFilter] = React.useState("all")

  const fetchLeads = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/leads")
      const data = await response.json()
      setLeads(data)
      setFilteredLeads(data)
      if (selectedLead) {
        const updated = data.find((l: any) => l.id === selectedLead.id)
        if (updated) setSelectedLead(updated)
      }
    } catch (error) {
      console.error("Error fetching leads:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedLead])

  React.useEffect(() => {
    fetchLeads()
  }, [])

  React.useEffect(() => {
    let result = [...leads]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(lead => 
        lead.companyName.toLowerCase().includes(query) || 
        (lead.website && lead.website.toLowerCase().includes(query)) ||
        (lead.decisionMakerName && lead.decisionMakerName.toLowerCase().includes(query))
      )
    }

    if (industryFilter !== "all") {
      result = result.filter(lead => lead.industry?.toLowerCase() === industryFilter.toLowerCase())
    }

    if (statusFilter !== "all") {
      result = result.filter(lead => lead.status?.toLowerCase() === statusFilter.toLowerCase())
    }

    if (countryFilter !== "all") {
      result = result.filter(lead => lead.country?.toLowerCase() === countryFilter.toLowerCase())
    }

    setFilteredLeads(result)
  }, [leads, searchQuery, industryFilter, statusFilter, countryFilter])

  const groupedLeads = React.useMemo(() => {
    const groups: Record<string, any[]> = {}
    filteredLeads.forEach(lead => {
      const country = lead.country || "Unknown"
      if (!groups[country]) groups[country] = []
      groups[country].push(lead)
    })
    return groups
  }, [filteredLeads])

  const countries = React.useMemo(() => {
    const set = new Set<string>()
    leads.forEach(lead => {
      if (lead.country) set.add(lead.country)
    })
    return Array.from(set).sort()
  }, [leads])

  const openLeadDetails = (lead: any) => {
    setSelectedLead(lead)
    setIsSheetOpen(true)
  }

  const enrichLead = async (id: string) => {
    try {
      setIsEnriching(true)
      const response = await fetch(`/api/leads/${id}/enrich`, {
        method: "POST",
      })
      if (response.ok) {
        const updatedLead = await response.json()
        setSelectedLead(updatedLead)
        await fetchLeads()
      }
    } catch (error) {
      console.error("Error enriching lead:", error)
    } finally {
      setIsEnriching(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "INTERESTED":
      case "WON":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "DISCOVERY_CALL_BOOKED":
      case "PROPOSAL_SENT":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "NEW":
      case "ENRICHED":
        return "bg-slate-500/10 text-slate-500 border-slate-500/20"
      case "LOST":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    }
  }

  if (isLoading && leads.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Lead Database</h2>
          <p className="text-muted-foreground">
            Manage and track all your identified ISO consultancy leads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "grid" | "grouped")}>
            <TabsList>
              <TabsTrigger value="list"><List className="h-4 w-4 mr-2" /> List</TabsTrigger>
              <TabsTrigger value="grid"><LayoutGrid className="h-4 w-4 mr-2" /> Grid</TabsTrigger>
              <TabsTrigger value="grouped"><Globe className="h-4 w-4 mr-2" /> Grouped</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button>Export Leads</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads by company, contact or website..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map(i => <SelectItem key={i} value={i.toLowerCase()}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {leadStatuses.map(s => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  setSearchQuery("")
                  setIndustryFilter("all")
                  setStatusFilter("all")
                  setCountryFilter("all")
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "list" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Lead Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openLeadDetails(lead)}
                  >
                    <TableCell>
                      <div className="font-medium">{lead.companyName}</div>
                      <div className="text-xs text-muted-foreground">{lead.website}</div>
                    </TableCell>
                    <TableCell>{lead.industry || "N/A"}</TableCell>
                    <TableCell>{lead.country || "N/A"}</TableCell>
                    <TableCell>{lead.location || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold">{lead.score}</div>
                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-secondary" 
                            style={{ width: `${lead.score}%` }} 
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openLeadDetails(lead)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>Send Email</DropdownMenuItem>
                          <DropdownMenuItem>Move to Pipeline</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Delete Lead</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredLeads.map((lead) => (
                <Card key={lead.id} className="cursor-pointer hover:border-secondary/50 transition-colors" onClick={() => openLeadDetails(lead)}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{lead.companyName}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {lead.website?.replace("https://", "") || "N/A"}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(lead.status)} variant="outline">
                        {lead.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{lead.industry || "N/A"}</span>
                      <span className="text-muted-foreground">{lead.country ? `${lead.country}${lead.location ? `, ${lead.location}` : ""}` : (lead.location || "N/A")}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Lead Score</span>
                        <span className="text-secondary">{lead.score}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-secondary" 
                          style={{ width: `${lead.score}%` }} 
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {lead.relevantIsoNeed && (
                        <Badge variant="secondary" className="text-[10px]">{lead.relevantIsoNeed}</Badge>
                      )}
                      {lead.signals?.slice(0, 1).map((s: any) => (
                        <Badge key={s.id} variant="outline" className="text-[10px]">{s.type}</Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {lead.decisionMakerName || "N/A"}
                    </div>
                    <Button size="sm" variant="ghost">View</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedLeads).map(([country, leads]) => (
                <div key={country} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold">{country}</h3>
                    <Badge variant="secondary">{leads.length} leads</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {leads.map((lead) => (
                      <Card key={lead.id} className="cursor-pointer hover:border-secondary/50 transition-colors" onClick={() => openLeadDetails(lead)}>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm truncate">{lead.companyName}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground truncate max-w-[100px]">{lead.industry || "N/A"}</span>
                            <Badge className={`text-[8px] h-4 ${getStatusColor(lead.status)}`} variant="outline">
                              {lead.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span>Score: {lead.score}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedLead && (
            <div className="space-y-6 py-4">
              <SheetHeader className="space-y-1">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="mb-2">Lead Detail</Badge>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => enrichLead(selectedLead.id)}
                      disabled={isEnriching}
                    >
                      {isEnriching ? (
                        <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Enriching...</>
                      ) : (
                        <><Zap className="h-3 w-3 mr-2" /> Enrich Lead</>
                      )}
                    </Button>
                    <Badge variant="outline" className={getStatusColor(selectedLead.status)}>
                      {selectedLead.status}
                    </Badge>
                  </div>
                </div>
                <SheetTitle className="text-2xl font-bold">{selectedLead.companyName}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <ExternalLink className="h-3 w-3" />
                  <a href={selectedLead.website || "#"} target="_blank" className="hover:underline">
                    {selectedLead.website || "No website"}
                  </a>
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-3 border rounded-lg bg-muted/30">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Lead Score</p>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-secondary" />
                    <span className="text-xl font-bold">{selectedLead.score}/100</span>
                  </div>
                </div>
                <div className="space-y-1 p-3 border rounded-lg bg-muted/30">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Country / Location</p>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium truncate">{selectedLead.country ? `${selectedLead.country}${selectedLead.location ? `, ${selectedLead.location}` : ""}` : (selectedLead.location || "N/A")}</span>
                  </div>
                </div>
                <div className="space-y-1 p-3 border rounded-lg bg-muted/30">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Industry</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium truncate">{selectedLead.industry || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-1 p-3 border rounded-lg bg-muted/30">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Company Size</p>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{selectedLead.companySize || "N/A"}</span>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Key Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{selectedLead.decisionMakerName || "N/A"}</span>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{selectedLead.decisionMakerEmail || "No email"}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    ISO Opportunity Signals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Detected Needs:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.relevantIsoNeed ? (
                        <Badge variant="secondary">{selectedLead.relevantIsoNeed}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No specific ISO needs detected yet. Run enrichment.</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Buying Signals:</p>
                    <div className="space-y-2">
                      {selectedLead.signals && selectedLead.signals.length > 0 ? (
                        selectedLead.signals.map((signal: any) => (
                          <div key={signal.id} className="flex items-start gap-2 text-xs p-2 bg-muted/50 rounded-md border border-secondary/20">
                            <div className="h-1.5 w-1.5 rounded-full bg-secondary mt-1.5 shrink-0" />
                            <div>
                              <div className="font-bold uppercase text-[10px] mb-0.5">{signal.type}</div>
                              <span>{signal.description}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No signals detected yet.</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button className="flex-1">Start Outreach</Button>
                <Button variant="outline" className="flex-1">Schedule Call</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
