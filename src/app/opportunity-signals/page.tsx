"use client"

import * as React from "react"
import { 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Zap,
  Bell,
  ArrowRight,
  TrendingUp,
  Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface AutomationRule {
  id: string
  name: string
  trigger: string
  condition: any
  action: string
  actionData: any
  isActive: boolean
}

export default function OpportunitySignalsPage() {
  const [rules, setRules] = React.useState<AutomationRule[]>([])
  const [signals, setSignals] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [editingRule, setEditingRule] = React.useState<AutomationRule | null>(null)

  // Form State
  const [formData, setFormData] = React.useState({
    name: "",
    trigger: "SCORE_THRESHOLD",
    minScore: 80,
    action: "NOTIFY",
    campaignId: "",
    isActive: true
  })

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const [rulesRes, leadsRes] = await Promise.all([
        fetch("/api/automation-rules"),
        fetch("/api/leads")
      ])
      
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json()
        setRules(rulesData)
      }

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json()
        // Extract signals from all leads
        const allSignals = leadsData.flatMap((lead: any) => 
          (lead.signals || []).map((s: any) => ({
            ...s,
            companyName: lead.companyName,
            leadId: lead.id
          }))
        ).sort((a: any, b: any) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
        setSignals(allSignals)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenAdd = () => {
    setEditingRule(null)
    setFormData({
      name: "",
      trigger: "SCORE_THRESHOLD",
      minScore: 80,
      action: "NOTIFY",
      campaignId: "",
      isActive: true
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (rule: AutomationRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      trigger: rule.trigger,
      minScore: rule.condition.minScore || 80,
      action: rule.action,
      campaignId: rule.actionData.campaignId || "",
      isActive: rule.isActive
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      const response = await fetch(`/api/automation-rules/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast.success("Rule deleted")
        fetchData()
      }
    } catch (error) {
      toast.error("Error deleting rule")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const payload = {
      name: formData.name,
      trigger: formData.trigger,
      condition: { minScore: Number(formData.minScore) },
      action: formData.action,
      actionData: { campaignId: formData.campaignId },
      isActive: formData.isActive
    }

    try {
      const url = editingRule ? `/api/automation-rules/${editingRule.id}` : "/api/automation-rules"
      const response = await fetch(url, {
        method: editingRule ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success("Rule saved")
        setIsDialogOpen(false)
        fetchData()
      }
    } catch (error) {
      toast.error("Error saving rule")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading && rules.length === 0 && signals.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Opportunity Signals & Automation</h2>
        <p className="text-muted-foreground">
          Monitor buying signals and set up automated workflows to engage leads instantly.
        </p>
      </div>

      <Tabs defaultValue="signals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="signals">Signals Feed</TabsTrigger>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Signals</CardTitle>
              <CardDescription>
                Live feed of detected buying signals from your lead database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {signals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground italic">
                    No signals detected yet. Enrich some leads to find opportunities.
                  </div>
                ) : (
                  signals.map((signal) => (
                    <div key={signal.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex gap-4">
                        <div className="mt-1 bg-secondary/10 p-2 rounded-full">
                          <Zap className="h-4 w-4 text-secondary" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-sm">{signal.companyName}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold">{signal.type}</Badge>
                            <span className="text-sm text-muted-foreground">{signal.description}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(signal.detectedAt).toLocaleString()}
                            {signal.sourceUrl && (
                              <>
                                <span>•</span>
                                <a href={signal.sourceUrl} target="_blank" className="hover:underline flex items-center gap-1">
                                  Source <ArrowRight className="h-2 w-2" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="flex items-center gap-1 font-bold text-secondary text-xs">
                            <TrendingUp className="h-3 w-3" />
                            Confidence: {(signal.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                        <Button size="sm" variant="outline">View Lead</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 mr-2" /> Create Rule
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Automations</CardTitle>
              <CardDescription>
                Rules that trigger actions when specific conditions are met.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                        No automation rules created yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span className="font-bold">{rule.trigger}</span>
                            <br />
                            <span className="text-muted-foreground">Score &gt; {rule.condition.minScore}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <Badge variant="secondary">{rule.action}</Badge>
                            {rule.actionData.campaignId && <span className="text-muted-foreground truncate max-w-[100px]">ID: {rule.actionData.campaignId}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {rule.isActive ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEdit(rule)}>
                                <Edit2 className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(rule.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingRule ? "Edit Automation Rule" : "Create Automation Rule"}</DialogTitle>
              <DialogDescription>
                Automate your outreach based on lead signals and scores.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="rule_name">Rule Name</Label>
                <Input 
                  id="rule_name" 
                  placeholder="e.g. Auto-add High Score Leads to Outreach" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Trigger</Label>
                  <Select value={formData.trigger} onValueChange={(v) => setFormData({ ...formData, trigger: v || "SCORE_THRESHOLD" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCORE_THRESHOLD">Score Threshold</SelectItem>
                      <SelectItem value="SIGNAL_DETECTED">New Signal Detected</SelectItem>
                      <SelectItem value="STATUS_CHANGE">Status Change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Min Score</Label>
                  <Input 
                    type="number" 
                    value={formData.minScore}
                    onChange={(e) => setFormData({ ...formData, minScore: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Action</Label>
                <Select value={formData.action} onValueChange={(v) => setFormData({ ...formData, action: v || "NOTIFY" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOTIFY">Internal Notification</SelectItem>
                    <SelectItem value="ADD_TO_CAMPAIGN">Add to Campaign</SelectItem>
                    <SelectItem value="CHANGE_STATUS">Change Lead Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.action === "ADD_TO_CAMPAIGN" && (
                <div className="grid gap-2">
                  <Label>Campaign ID</Label>
                  <Input 
                    placeholder="cl..." 
                    value={formData.campaignId}
                    onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Switch 
                  id="rule_active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="rule_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingRule ? "Update Rule" : "Create Rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
