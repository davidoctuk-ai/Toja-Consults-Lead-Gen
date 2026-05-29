import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Toja Lead Gen - AI-Powered ISO Lead Generation",
  description: "Automated lead generation platform for Toja Consultancy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
                <SidebarTrigger className="-ml-1" />
                <div className="flex-1 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold tracking-tight text-primary">Toja Consultancy</h1>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none">ISO LEAD GENERATION</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/20">Live Platform</Badge>
                </div>
              </header>
              <main className="p-6 md:p-10 max-w-7xl mx-auto w-full">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
