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

export default function LeadSearchPage() {
  const router = useRouter()
  const [isSearching, setIsSearching] = React.useState(false)
  const [minScore, setMinScore] = React.useState([50])
  const [query, setQuery] = React.useState("")
  const [location, setLocation] = React.useState("")

  const handleSearch = async () => {
    if (!query) {
      toast.error("Please enter a search query")
      return
    }

    try {
      setIsSearching(true)
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
      toast.success(`Discovered ${data.count} leads`)
      
      // Redirect to leads page to see results
      router.push('/leads')
    } catch (err) {
      console.error('Search error:', err)
      toast.error('Discovery failed')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Lead Search</h2>
        <p className="text-muted-foreground">
          Find and identify companies that likely need ISO certification support.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Parameters</CardTitle>
          <CardDescription>
            Specify keywords, location, and industry filters to discover new leads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="keywords"
                  placeholder="e.g. Construction, Manufacturing..."
                  className="pl-8"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="e.g. London, Manchester..."
                  className="pl-8"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select>
                <SelectTrigger id="industry">
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
            <div className="space-y-2">
              <Label>Minimum Scoring (Likelihood)</Label>
              <div className="pt-2">
                <Slider
                  value={minScore}
                  onValueChange={(val) => setMinScore(Array.isArray(val) ? [...val] : [val])}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Score: {minScore}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 lg:col-span-2 flex items-end">
              <Button onClick={handleSearch} className="w-full md:w-auto" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Start Search & Discovery
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="opacity-60 grayscale-[50%]">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-6 w-12 bg-muted rounded-full animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="bg-muted/30 border rounded-lg p-8 text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
          <Info className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium">Ready to find new opportunities?</h3>
          <p className="text-muted-foreground mt-2">
            Enter your search criteria above to trigger our AI discovery engine. We'll scrape public data, detect buying signals, and enrich your results automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
