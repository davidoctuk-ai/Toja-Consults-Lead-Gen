"use client"

import * as React from "react"
import { 
  Save, 
  Key, 
  Palette, 
  Globe, 
  Mail, 
  ShieldCheck,
  Loader2,
  CheckCircle2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [settings, setSettings] = React.useState<any>({})

  React.useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings")
        if (response.ok) {
          const data = await response.json()
          // Convert array of {key, value} to object
          const settingsObj = data.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value
            return acc
          }, {})
          setSettings(settingsObj)
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      
      if (response.ok) {
        toast.success("Settings saved", {
          description: "Your system configuration has been updated.",
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast.error("Error", {
        description: "Could not save settings. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">System Settings</h2>
        <p className="text-muted-foreground">
          Configure API integrations, branding, and global automation defaults.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Regional & Defaults
                </CardTitle>
                <CardDescription>
                  Global settings for lead generation and geographic targeting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="default_country">Default Target Country</Label>
                  <Input 
                    id="default_country" 
                    placeholder="e.g. United Kingdom" 
                    value={settings.default_country || ""}
                    onChange={(e) => updateSetting("default_country", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="timezone">System Timezone</Label>
                  <Input 
                    id="timezone" 
                    placeholder="UTC" 
                    value={settings.timezone || "UTC"}
                    onChange={(e) => updateSetting("timezone", e.target.value)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Enrich New Leads</Label>
                    <p className="text-sm text-muted-foreground">Automatically trigger data enrichment for every new lead found.</p>
                  </div>
                  <Switch 
                    checked={settings.auto_enrich === true}
                    onCheckedChange={(checked) => updateSetting("auto_enrich", checked)}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 flex justify-end py-3">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  External Integrations
                </CardTitle>
                <CardDescription>
                  Manage API keys for AI enrichment and data scraping services.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="openai_api_key">OpenAI API Key</Label>
                  <Input 
                    id="openai_api_key" 
                    type="password" 
                    placeholder="sk-..." 
                    value={settings.openai_api_key || ""}
                    onChange={(e) => updateSetting("openai_api_key", e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">Used for lead scoring, personalized emails, and signal detection.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="google_maps_api_key">Google Maps / Places API Key</Label>
                  <Input 
                    id="google_maps_api_key" 
                    type="password" 
                    placeholder="AIza..." 
                    value={settings.google_maps_api_key || ""}
                    onChange={(e) => updateSetting("google_maps_api_key", e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">Used for geographic lead discovery and company verification.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apollo_api_key">Apollo.io API Key</Label>
                  <Input 
                    id="apollo_api_key" 
                    type="password" 
                    placeholder="Optional" 
                    value={settings.apollo_api_key || ""}
                    onChange={(e) => updateSetting("apollo_api_key", e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 flex justify-end py-3">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  White-labeling & Branding
                </CardTitle>
                <CardDescription>
                  Customize the platform appearance and consultancy identity.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="consultancy_name">Consultancy Name</Label>
                  <Input 
                    id="consultancy_name" 
                    value={settings.consultancy_name || "Toja Consultancy"}
                    onChange={(e) => updateSetting("consultancy_name", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="primary_color">Primary Brand Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="primary_color" 
                      value={settings.primary_color || "#0F172A"}
                      onChange={(e) => updateSetting("primary_color", e.target.value)}
                      className="font-mono"
                    />
                    <div 
                      className="w-10 h-10 rounded border" 
                      style={{ backgroundColor: settings.primary_color || "#0F172A" }} 
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input 
                    id="logo_url" 
                    placeholder="https://..." 
                    value={settings.logo_url || ""}
                    onChange={(e) => updateSetting("logo_url", e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 flex justify-end py-3">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Alerts & Notifications
                </CardTitle>
                <CardDescription>
                  Configure where you receive updates about new hot leads.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="alert_email">Alert Email Address</Label>
                  <Input 
                    id="alert_email" 
                    placeholder="admin@toja.com" 
                    value={settings.alert_email || ""}
                    onChange={(e) => updateSetting("alert_email", e.target.value)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Lead Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notify me when a high-scoring lead is found.</p>
                  </div>
                  <Switch 
                    checked={settings.notify_new_leads === true}
                    onCheckedChange={(checked) => updateSetting("notify_new_leads", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Report</Label>
                    <p className="text-sm text-muted-foreground">Receive a weekly summary of campaign performance.</p>
                  </div>
                  <Switch 
                    checked={settings.weekly_report === true}
                    onCheckedChange={(checked) => updateSetting("weekly_report", checked)}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 flex justify-end py-3">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}
