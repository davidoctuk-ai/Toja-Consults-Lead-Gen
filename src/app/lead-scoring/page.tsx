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
  AlertTriangle
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface ScoringRule {
  id: string
  name: string
  description: string
  points: number
  criteria: {
    field: string
    operator: string
    value: string
  }
  isActive: boolean
}

export default function LeadScoringPage() {
  const [rules, setRules] = React.useState<ScoringRule[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [editingRule, setEditingRule] = React.useState<ScoringRule | null>(null)

  // Form State
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    points: 10,
    field: "industry",
    operator: "equals",
    value: "",
    isActive: true
  })

  const fetchRules = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/scoring-rules")
      if (response.ok) {
        const data = await response.json()
        setRules(data)
      }
    } catch (error) {
      console.error("Error fetching scoring rules:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const handleOpenAdd = () => {
    setEditingRule(null)
    setFormData({
      name: "",
      description: "",
      points: 10,
      field: "industry",
      operator: "equals",
      value: "",
      isActive: true
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (rule: ScoringRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      description: rule.description,
      points: rule.points,
      field: rule.criteria.field,
      operator: rule.criteria.operator,
      value: rule.criteria.value,
      isActive: rule.isActive
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return

    try {
      const response = await fetch(`/api/scoring-rules/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success("Rule deleted")
        fetchRules()
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
      description: formData.description,
      points: Number(formData.points),
      criteria: {
        field: formData.field,
        operator: formData.operator,
        value: formData.value
      },
      isActive: formData.isActive
    }

    try {
      const url = editingRule 
        ? `/api/scoring-rules/${editingRule.id}` 
        : "/api/scoring-rules"
      
      const response = await fetch(url, {
        method: editingRule ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(editingRule ? "Rule updated" : "Rule created", {
          description: `Scoring rule "${formData.name}" has been saved.`
        })
        setIsDialogOpen(false)
        fetchRules()
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast.error("Error saving rule")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading && rules.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Lead Scoring Rules</h2>
          <p className="text-muted-foreground">
            Define how leads are prioritized based on their profile and buying signals.
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-2" /> Add Rule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Rules</CardTitle>
          <CardDescription>
            Rules are applied cumulatively to calculate a lead's score (0-100).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                    No scoring rules defined yet. Create your first rule to start prioritizing leads.
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-xs text-muted-foreground">{rule.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.points > 0 ? "secondary" : "destructive"}>
                        {rule.points > 0 ? `+${rule.points}` : rule.points}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs bg-muted p-1 px-2 rounded font-mono inline-block">
                        {rule.criteria.field} {rule.criteria.operator} "{rule.criteria.value}"
                      </div>
                    </TableCell>
                    <TableCell>
                      {rule.isActive ? (
                        <div className="flex items-center text-green-500 text-xs gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </div>
                      ) : (
                        <div className="flex items-center text-muted-foreground text-xs gap-1">
                          <XCircle className="h-3 w-3" /> Inactive
                        </div>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingRule ? "Edit Rule" : "Add New Rule"}</DialogTitle>
              <DialogDescription>
                Define a criteria and point value to update lead scores.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Construction Industry Bonus" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  placeholder="Why this rule exists..." 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="points">Points Impact</Label>
                  <Input 
                    id="points" 
                    type="number" 
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="flex items-center gap-2 mt-auto pb-2">
                  <Switch 
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <Separator className="my-2" />
              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase text-muted-foreground">Criteria</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="grid gap-1">
                    <Label className="text-[10px]" htmlFor="field">Field</Label>
                    <Select value={formData.field} onValueChange={(v) => setFormData({ ...formData, field: v })}>
                      <SelectTrigger id="field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="industry">Industry</SelectItem>
                        <SelectItem value="companySize">Company Size</SelectItem>
                        <SelectItem value="country">Country</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="relevantIsoNeed">ISO Need</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]" htmlFor="operator">Operator</Label>
                    <Select value={formData.operator} onValueChange={(v) => setFormData({ ...formData, operator: v })}>
                      <SelectTrigger id="operator">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="notEquals">Not Equals</SelectItem>
                        <SelectItem value="startsWith">Starts With</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px]" htmlFor="value">Value</Label>
                    <Input 
                      id="value" 
                      placeholder="Value..." 
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      required
                    />
                  </div>
                </div>
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
