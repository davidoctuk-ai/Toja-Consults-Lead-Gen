"use client"

import * as React from "react"
import {
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Database,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Search,
  Settings,
  Settings2,
  Target,
  Users,
  ShieldCheck,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Overview",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Lead Generation",
      items: [
        {
          title: "Lead Search",
          url: "/lead-search",
          icon: Search,
        },
        {
          title: "Lead Database",
          url: "/leads",
          icon: Database,
        },
        {
          title: "Scoring Rules",
          url: "/lead-scoring",
          icon: Target,
        },
        {
          title: "ISO Signals",
          url: "/opportunity-signals",
          icon: CheckCircle2,
        },
        {
          title: "Scraper Configs",
          url: "/scraper-configs",
          icon: Settings2,
        },
      ],
    },
    {
      title: "Outreach",
      items: [
        {
          title: "Campaign Builder",
          url: "/campaigns",
          icon: Mail,
        },
        {
          title: "Email Templates",
          url: "/templates",
          icon: MessageSquare,
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          title: "CRM Pipeline",
          url: "/pipeline",
          icon: Building2,
        },
        {
          title: "Consultations",
          url: "/consultations",
          icon: Calendar,
        },
        {
          title: "Analytics",
          url: "/analytics",
          icon: BarChart3,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-6 font-bold text-primary">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="group-data-[collapsible=icon]:hidden text-xl tracking-tighter">Toja Lead Gen</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50">{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.url ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip={item.title}
                      render={
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      }
                    />
                  </SidebarMenuItem>
                ) : (
                  item.items?.map((subItem) => (
                    <SidebarMenuItem key={subItem.title}>
                      <SidebarMenuButton
                        tooltip={subItem.title}
                        render={
                          <a href={subItem.url}>
                            <subItem.icon />
                            <span>{subItem.title}</span>
                          </a>
                        }
                      />
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              render={
                <a href="/settings">
                  <Settings />
                  <span>Settings</span>
                </a>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
