# Toja Lead Gen - AI Lead Generation & CRM

A fully automated AI-powered lead generation platform for **Toja Consultancy**. This platform automatically identifies, enriches, scores, and contacts companies globally that are likely to need ISO consultancy services.

## Features

- **Global Lead Discovery**: Multi-source scraping from Google Maps (Places API) and LinkedIn (Proxycurl).
- **Country Intelligence**: Automatic geographic grouping and filtering for global scale.
- **AI Enrichment**: GPT-4o powered website analysis to detect buying signals (Tenders, Hiring, Compliance needs).
- **Intelligent Scoring**: Custom point-based scoring engine to prioritize Hot leads.
- **Automation Engine**: Set up trigger-based rules to auto-add leads to campaigns or change statuses.
- **Outreach Automation**: Campaign builder with personalized email templates and a background SMTP worker.
- **Calendar & Booking**: Integrated Google Calendar support for scheduling discovery calls with auto-Meet links.
- **CRM Pipeline**: Interactive Kanban board to manage leads through the sales cycle.
- **Analytics Dashboard**: Real-time KPI tracking, performance charts, and geographic breakdowns.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, Tailwind CSS 4, Shadcn UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Production), SQLite (Dev/Test)
- **AI**: OpenAI API (GPT-4o)
- **APIs**: Google Places API, Proxycurl API (LinkedIn), Google Calendar API

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or use SQLite for local development)
- API Keys: OpenAI, Google Cloud (Places + Calendar), Proxycurl

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your actual credentials.

4. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```

5. Push the schema to your database:
   ```bash
   npx prisma db push
   ```

6. Seed the database with default rules and templates:
   ```bash
   npx prisma db seed
   ```

7. Run the development server:
   ```bash
   npm run dev
   ```

8. Run the background automation worker (Emails & Scraper Scheduler):
   ```bash
   npm run worker
   ```

## Management UI

Access the following pages to manage the platform's "brains":
- `/settings`: API Keys, Branding, and Global Defaults.
- `/lead-scoring`: Define point rules for prioritization.
- `/opportunity-signals`: Monitor buying signals and automation rules.
- `/scraper-configs`: Manage and trigger recurring discovery jobs.

## License

Private - Toja Consultancy
 
