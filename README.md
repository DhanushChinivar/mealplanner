<div align="center">

  <div>
    <img src="https://img.shields.io/badge/-Next.js-black?style=for-the-badge&logoColor=white&logo=next.js&color=000000"/>
    <img src="https://img.shields.io/badge/-Clerk-black?style=for-the-badge&logoColor=white&logo=clerk&color=1E1E1E"/>
    <img src="https://img.shields.io/badge/-Prisma-black?style=for-the-badge&logoColor=white&logo=prisma&color=2D3748"/>
    <img src="https://img.shields.io/badge/-Stripe-black?style=for-the-badge&logoColor=white&logo=stripe&color=635BFF"/><br/>
    <img src="https://img.shields.io/badge/-PostgreSQL-black?style=for-the-badge&logoColor=white&logo=postgresql&color=316192"/>
    <img src="https://img.shields.io/badge/-TailwindCSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=38B2AC"/>
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6"/>
    <img src="https://img.shields.io/badge/-OpenAI-black?style=for-the-badge&logoColor=white&logo=openai&color=0A0A0A"/>
  </div>

  <h1 align="center">MealsForge</h1>
  <p align="center">AI-powered meal planning with personalized nutrition, smart grocery lists, and subscription access.</p>

  <p align="center">
    <a href="https://mealsforge.com">View Live Demo</a> ·
    <a href="https://github.com/DhanushChinivar/mealplanner/issues">Report Bug</a> ·
    <a href="https://github.com/DhanushChinivar/mealplanner/issues">Request Feature</a>
  </p>

</div>

---

## About the Project

It started with a simple frustration — figuring out what to eat every week takes more time and mental energy than it should. So I built MealsForge: an AI-powered meal planner that takes your diet goals, calorie targets, allergies, and cuisine preferences, and hands you back a full week of meals in seconds.

From there it grew into something more complete. It generates your grocery list automatically, lets you swap out individual meals you don't like, and tracks whether you actually followed through — with streaks, adherence stats, and a heatmap to keep you honest.

Under the hood it's a full production stack: Next.js, PostgreSQL, Stripe subscriptions, Clerk auth, and OpenAI doing the heavy lifting. Built as a student project to go beyond tutorials and ship something real.

### Key highlights:
- AI-generated weekly meal plans with meal swaps and serving adjustments
- Grocery list automation derived from meal plans
- Meal logging and adherence analytics
- Subscription and trial access flow with Stripe + Clerk
- Reliable data modeling with Prisma + PostgreSQL

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Auth | Clerk |
| Database | PostgreSQL + Prisma |
| Styling | TailwindCSS |
| Payments | Stripe |
| AI | OpenAI (optional OpenRouter fallback) |
| Data Fetching | React Query |

---

## Features

- **Personalized Meal Plans** — Generate weekly plans tailored to calories, diet type, allergies, cuisine, and servings.
- **Meal Swaps** — Replace individual meals without regenerating the full week.
- **Smart Grocery Lists** — Auto-generated ingredients grouped by category.
- **Meal Tracking** — Log completed and skipped meals with adherence stats.
- **Insights Dashboard** — Macro balance, streaks, and completion heatmaps.
- **Subscription Access** — Stripe-powered plans with Clerk-based authentication.

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm
- PostgreSQL database

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/mealplanner.git
cd mealplanner

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=

# Clerk
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_WEEKLY=
STRIPE_PRICE_MONTHLY=
STRIPE_PRICE_YEARLY=

# AI
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENROUTER_API_KEY=
OPENROUTER_MODELS=meta-llama/llama-3.2-3b-instruct:free
```

### Running Locally

```bash
# Start the dev server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## Project Structure

```
mealplanner/
├── app/                  # Next.js App Router
├── components/           # UI components
├── lib/                  # Helpers, Prisma, Stripe
├── prisma/               # Prisma schema & migrations
├── public/               # Static assets
└── scripts/              # Utility scripts
```

---

## Contact

Dhanush Chinivar · [dhanushchinivar@gmail.com](mailto:dhanushchinivar@gmail.com) · [LinkedIn](https://www.linkedin.com/in/dhanush-chinivar/)