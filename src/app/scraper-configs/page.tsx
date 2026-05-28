"use client"

import * as React from "react"
import { 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  Edit2, 
  Play, 
  Pause, 
  Loader2,
  Settings2,
  Calendar,
  Search,
  Globe,
  Briefcase
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
import { toast } from "sonner"

interface ScraperConfig {
  id: string
  name: string
  type: string
  config: any
  lastRunAt: string | null
  nextRunAt: string | null
  interval: number | null
  status: string
  isActive: boolean
}

export default function ScraperConfigsPage() {
  const [configs, setConfigs] = React.useState<ScraperConfig[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [editingConfig, setEditingRule] = React.useState<ScraperConfig | null>(null)

  // Form State
  const [formData, setFormData] = React.useState({
    name: "",
    type: "GOOGLE_MAPS",
    queries: "",
    locations: "",
    interval: "1440", // 24 hours in minutes
    isActive: true
  })

  const fetchConfigs = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/scraper-configs")
      if (response.ok) {
        const data = await response.json()
        setConfigs(data)
      }
    } catch (error) {
      console.error("Error fetching scraper configs:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  const handleOpenAdd = () => {
    setEditingRule(null)
    setFormData({
      name: "",
      type: "GOOGLE_MAPS",
      queries: "",
      locations: "",
      interval: "1440",
      isActive: true
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (config: ScraperConfig) => {
    setEditingRule(config)
    setFormData({
      name: config.name,
      type: config.type,
      queries: config.config.queries?.join(", ") || "",
      locations: config.config.locations?.join(", ") || "",
      interval: String(config.interval || 0),
      isActive: config.isActive
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scraper?")) return
    try {
      const response = await fetch(`/api/scraper-configs/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast.success("Scraper deleted")
        fetchConfigs()
      }
    } catch (error) {
      toast.error("Error deleting scraper")
    }
  }

  const handleRunManual = async (id: string) => {
    toast.info("Starting scraper job...")
    try {
      const response = await fetch(`/api/scraper-configs/${id}/run`, { method: "POST" })
      if (response.ok) {
        toast.success("Scraper job started successfully")
        fetchConfigs()
      }
    } catch (error) {
      toast.error("Failed to trigger scraper")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const payload = {
      name: formData.name,
      type: formData.type,
      config: {
        queries: formData.queries.split(",").map(q => q.trim()).filter(Boolean),
        locations: formData.locations.split(",").map(l => l.trim()).filter(Boolean)
      },
      interval: formData.interval ? parseInt(formData.interval) : null,
      isActive: formData.isActive
    }

    try {
      const url = editingConfig ? `/api/scraper-configs/${editingConfig.id}` : "/api/scraper-configs"
      const response = await fetch(url, {
        method: editingConfig ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success("Scraper config saved")
        setIsDialogOpen(false)
        fetchConfigs()
      }
    } catch (error) {
      toast.error("Error saving config")
    } finally {
      setIsSaving(false)
    }
  }

  const getScraperIcon = (type: string) => {
    switch (type) {
      case "GOOGLE_MAPS": return <Globe className="h-4 w-4" />
      case "LINKEDIN": return <Link className="h-4 w-4" />
      case "JOB_BOARD": return <Briefcase className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  if (isLoading && configs.length === 0) {
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
          <h2 className="text-3xl font-bold tracking-tight text-primary">Scraper Configurations</h2>
          <p className="text-muted-foreground">
            Manage automated discovery jobs and geographic search parameters.
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-2" /> New Scraper
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Scrapers</CardTitle>
          <CardDescription>
            Recurring jobs that find new leads from public sources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scraper Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">
                    No scrapers configured.
                  </TableCell>
                </TableRow>
              ) : (
                configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <div className="font-medium">{config.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                        {config.config.queries?.join(", ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getScraperIcon(config.type)}
                        <span className="text-xs">{config.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        {config.interval ? `Every ${config.interval / 60}h` : "Manual"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {config.lastRunAt ? new Date(config.lastRunAt).toLocaleString() : "Never"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          config.status === "RUNNING" ? "bg-blue-500/10 text-blue-500" :
                          config.status === "FAILED" ? "bg-red-500/10 text-red-500" :
                          "bg-slate-500/10 text-slate-500"
                        }
                      >
                        {config.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-secondary"
                          onClick={() => handleRunManual(config.id)}
                          disabled={config.status === "RUNNING"}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(config)}>
                              <Edit2 className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateConfigStatus(config.id, !config.isActive)}>
                              {config.isActive ? <><Pause className="h-4 w-4 mr-2" /> Pause</> : <><Play className="h-4 w-4 mr-2" /> Resume</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(config.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
              <DialogTitle>{editingConfig ? "Edit Scraper" : "Configure New Scraper"}</DialogTitle>
              <DialogDescription>
                Set up search criteria and schedules for lead discovery.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="s_name">Scraper Name</Label>
                <Input 
                  id="s_name" 
                  placeholder="e.g. UK Construction Companies" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Source Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v || "GOOGLE_MAPS" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GOOGLE_MAPS">Google Maps / Places</SelectItem>
                      <SelectItem value="LINKEDIN">LinkedIn Companies</SelectItem>
                      <SelectItem value="JOB_BOARD">Job Boards (signals)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Interval (min)</Label>
                  <Input 
                    type="number" 
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                    placeholder="1440"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Search Queries (comma separated)</Label>
                <Input 
                  placeholder="ISO 9001 consultancy, manufacturing company..." 
                  value={formData.queries}
                  onChange={(e) => setFormData({ ...formData, queries: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Locations (comma separated)</Label>
                <Input 
                  placeholder="London, Manchester, Birmingham..." 
                  value={formData.locations}
                  onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch 
                  id="s_active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="s_active">Active Schedule</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingConfig ? "Update Config" : "Create Scraper"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )

  async function updateConfigStatus(id: string, active: boolean) {
    try {
      await fetch(`/api/scraper-configs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: active }),
      })
      fetchConfigs()
    } catch (e) {
      toast.error("Failed to update status")
    }
  }
}
