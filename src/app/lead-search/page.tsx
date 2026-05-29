"use client"

import * as React from "react"
import { Search, MapPin, Filter, Target, Info, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { industries } from "@/lib/mock-data"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { GlassCard } from "@/components/ui/glass-card"

export default function LeadSearchPage() {
  const router = useRouter()
  const [isSearching, setIsSearching] = React.useState(false)
  const [minScore, setMinScore] = React.useState([70])
  const [query, setQuery] = React.useState("")
  const [location, setLocation] = React.useState("")

  const handleSearch = async () => {
    if (!query) {
      toast.error("Please enter a search query")
      return
    }

    try {
      setIsSearching(true)
      // Simulate progress with toasts
      toast.info("Initializing AI Discovery Engine...")
      await new Promise(r => setTimeout(r, 1000))
      toast.info("Scraping public business directories...")
      await new Promise(r => setTimeout(r, 1500))
      toast.info("Detecting buying signals and ISO requirements...")

      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `${query} in ${location || 'UK'}`,
          scraperTypes: ['GOOGLE_MAPS'] 
        }),
      })

      if (!res.ok) throw new Error('Search failed')
      
      const data = await res.json()
      toast.success(`Success! Discovered ${data.count} qualified leads.`, {
        description: "Redirecting to your lead database."
      })
      
      setTimeout(() => {
        router.push('/leads')
      }, 1000)
    } catch (err) {
      console.error('Search error:', err)
      toast.error('Discovery failed. Please check your API configuration.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="text-center space-y-4">
        <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-widest font-bold bg-secondary/10 text-secondary border-secondary/20">
          AI-Powered Discovery
        </Badge>
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-primary">
          Find Your Next <span className="text-secondary italic">High-Value</span> Client
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Identify companies with active buying signals for ISO certification, compliance, and quality management.
        </p>
      </div>

      <GlassCard className="p-8 border-primary/10 shadow-2xl shadow-primary/5">
        <div className="grid gap-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="keywords" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Search Keywords</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="keywords"
                  placeholder="e.g. Construction, Solar Energy, SaaS"
                  className="pl-10 h-12 bg-background/50 border-primary/10 focus:border-secondary/50 focus:ring-secondary/20 transition-all text-base"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Target Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="e.g. London, United Kingdom, USA"
                  className="pl-10 h-12 bg-background/50 border-primary/10 focus:border-secondary/50 focus:ring-secondary/20 transition-all text-base"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Focus Industry</Label>
              <Select>
                <SelectTrigger id="industry" className="h-12 bg-background/50 border-primary/10">
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry.toLowerCase()}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Min. Qualification Score</Label>
                <Badge variant="outline" className="font-mono text-secondary border-secondary/30">{minScore}%</Badge>
              </div>
              <div className="pt-2 px-1">
                <Slider
                  value={minScore}
                  onValueChange={(val) => setMinScore(Array.isArray(val) ? [...val] : [val])}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSearch} 
            className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-secondary/20 hover:bg-secondary transition-all group" 
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Processing AI Discovery...
              </>
            ) : (
              <>
                <Zap className="mr-3 h-5 w-5 fill-current group-hover:animate-pulse" />
                Trigger Discovery Engine
              </>
            )}
          </Button>
        </div>
      </GlassCard>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Detected Needs", icon: Target, value: "ISO 9001, 27001, 14001" },
          { label: "Buying Signals", icon: Zap, value: "Tenders, Job Hires, Growth" },
          { label: "Lead Enrichment", icon: Info, value: "Verified Emails & Contacts" }
        ].map((item, i) => (
          <GlassCard key={i} className="p-4 flex items-center gap-4 border-primary/5">
            <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">{item.label}</p>
              <p className="text-sm font-bold text-primary">{item.value}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
