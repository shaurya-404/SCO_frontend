# SmartCloud Optimizer Frontend

A React + TypeScript + Vite frontend for reviewing cloud resource health, utilization, costs, recommendations, and forecasting in a role-aware operations dashboard.

## Overview

This project provides the user interface for the SmartCloud Optimizer platform. It includes:

- secure login and registration flows
- role-aware navigation for engineers, finance, and leadership users
- cloud inventory and utilization dashboards
- cost and budget analysis
- optimization recommendations and simulator tooling
- alerting, sustainability insights, AI explanations, and export actions
- responsive dark/light theming and reusable UI components

## Tech stack

- React 19
- TypeScript
- Vite
- ESLint
- Tailwind CSS

## Prerequisites

- Node.js 18+ recommended
- npm
- A running backend API that exposes the expected endpoints for auth and resource data

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

   If `.env.example` is not present, create a `.env` file with:

   ```bash
   VITE_API_URL=http://localhost:5001/api
   ```

3. Start the app in development mode:

   ```bash
   npm run dev
   ```

4. Open the local Vite URL shown in the terminal, usually:

   ```text
   http://localhost:5173
   ```

## Environment variables

- `VITE_API_URL` — base URL for the backend API used by the frontend. Defaults to `http://localhost:5001/api` if unset.

## Available scripts

Run these from the frontend project root:

```bash
npm run dev
```
Starts the Vite development server with hot reloading.

```bash
npm run build
```
Runs the TypeScript build and creates a production bundle in `dist/`.

```bash
npm run lint
```
Runs ESLint across the frontend codebase to catch code-quality and correctness issues.

```bash
npm run preview
```
Serves the production build locally for a final verification pass.

## Features

### Authentication and access
- sign-in and register flows
- session persistence in browser storage
- role-aware navigation and route access control
- profile editing and account information management

### Dashboard and overview
- high-level cloud health summary
- spend and inventory overview
- alert, forecast, and recommendation snapshots
- quick navigation to operational modules

### Inventory and analytics
- resource inventory filtering by region, environment, and owner
- utilization history and detailed resource views
- CPU, memory, disk, and network metrics
- anomaly and trend analysis across fleet data

### Recommendations and optimization
- actionable optimization suggestions for idle or underutilized resources
- resizing recommendations based on historical utilization thresholds
- scheduling and off-hours optimization scenarios
- recommendation review workflow for change planning

### Cost and forecasting
- cost breakdowns by environment and owner
- budget and forecast visibility
- before-and-after impact estimates for proposed changes
- what-if simulation support for optimization planning

### Alerts and governance
- utilization, capacity, and budget alerts
- rule-based explanation of detected issues
- review-driven data export and operational snapshots

### Sustainability and exports
- sustainability impact estimates
- CSV inventory export capability
- IaC-style export for review-only infrastructure workflows
- AI-assisted explanation panel for operational context

### UX and app experience
- responsive layout for desktop and smaller screens
- light and dark theme support
- loading, empty, and error states
- toast notifications for user feedback

## Project structure

```text
src/
  components/   Shared UI and layout components
  context/      Auth, theme, and toast providers
  hooks/        Reusable hooks for data and state
  pages/        Feature pages and screen modules
  services/     API integration helpers
  types/        Shared TypeScript types
  utils/        Navigation and formatting utilities
```

## Notes

- This README focuses on the frontend application only.
- The frontend expects an API backend to be running and reachable through `VITE_API_URL`.
- For production validation, run `npm run build` and `npm run lint` before deployment.
