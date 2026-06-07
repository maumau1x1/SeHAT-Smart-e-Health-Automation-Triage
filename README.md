# SeHAT — Smart e-Health Automation & Triage

> An AI-powered multi-role health triage platform that connects patients, medical officers and pharmacists in one seamless clinical journey.

---

## Overview

SeHAT digitises the end-to-end outpatient workflow for Malaysian clinics. A patient describes their symptoms to an AI assistant, receives an ESI triage score, gets matched to a nearby clinic and joins a real-time queue — while the medical officer reviews the AI-generated clinical report and the pharmacist dispenses the prescription, all within the same system.

---

## Tech Stack

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TanStack](https://img.shields.io/badge/TanStack_Router-1-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Deploy-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

---

## Features

### Patient Portal
| Feature | Description |
|---|---|
| **AI Consultation** | Conversational symptom checker powered by Google Gemini 2.5 Flash via OpenRouter. Conducts a dynamic clinical interview (up to 5 turns), produces an ESI score (1–5) and flags red-flag emergencies immediately |
| **Clinic Finder** | Interactive Leaflet map showing nearby clinics with live queue length, estimated wait time, crowd level and available doctors by specialty |
| **Crowd Heatmap** | Time-slider heatmap predicting clinic congestion by hour of day |
| **Medical History** | Timeline view of all past consultations with expandable clinical details |
| **Medications** | Medication reminders with one-tap Google Calendar sync |
| **SOS Emergency** | Dedicated emergency screen with animated connection flow and ETA countdown |
| **QR Check-in** | Token-based QR code check-in to register arrival at a clinic |

### Medical Officer (MO) Portal
| Feature | Description |
|---|---|
| **Triage Queue** | Patient reports sorted by AI severity — Urgent, Moderate, Low |
| **Report Review** | Full AI assessment, symptom log and ESI rationale for each patient |
| **Verification & Prescription** | One-click verify, add diagnosis notes and issue a prescription to forward to the pharmacist |

### Pharmacist Portal
| Feature | Description |
|---|---|
| **Dispensing Queue** | Incoming prescriptions from verified MO reports |
| **Stock Status** | Per-medication In Stock / Low Stock / Out of Stock indicator |
| **Dispense Confirmation** | Confirm dispensing and close the patient journey |

---

## Architecture

SeHAT uses a **three-role, file-based routing** architecture built on TanStack Start (SSR) with Supabase as the backend.

```
src/
├── routes/
│   ├── __root.tsx          # Root shell, providers, meta tags
│   ├── index.tsx           # Patient home dashboard
│   ├── consultation.tsx    # AI symptom interview
│   ├── clinics.tsx         # Clinic finder map
│   ├── heatmap.tsx         # Crowd congestion heatmap
│   ├── visits.tsx          # Medical history timeline
│   ├── medications.tsx     # Medication reminders + calendar sync
│   ├── sos.tsx             # Emergency SOS screen
│   ├── mo.tsx              # Medical Officer portal
│   ├── mo.$id.tsx          # MO individual report view
│   ├── pharmacy.tsx        # Pharmacist portal
│   ├── pharmacy.$id.tsx    # Pharmacist dispensing detail
│   ├── checkin.$token.tsx  # QR check-in handler
│   ├── report.$id.tsx      # Shared report view
│   ├── onboarding.tsx      # Patient profile setup
│   ├── profile.tsx         # User profile
│   └── auth/login/         # Auth screens
├── lib/
│   ├── app-store.tsx       # Global React context (patient, reports, steps)
│   ├── ai.functions.ts     # Server function — OpenRouter / Gemini call
│   ├── pharmacy.functions.ts  # Server function — dispense logic
│   ├── reminders.functions.ts # Server function — Google Calendar sync
│   ├── clinics-helpers.ts  # Queue & crowd prediction utilities
│   └── use-clinics.ts      # TanStack Query hook for clinic data
├── components/
│   ├── MobileShell.tsx     # Patient portal layout wrapper
│   ├── PortalShell.tsx     # MO / Pharmacist portal layout wrapper
│   ├── ClinicsMap.tsx      # Leaflet map with heatmap layer
│   ├── SpotlightTour.tsx   # Onboarding guided tour
│   └── ui/                 # shadcn/ui component library
└── integrations/
    └── supabase/           # Supabase client and type definitions
```

---

## AI Triage — How It Works

1. Patient opens a consultation and describes their chief complaint.
2. Gemini 2.5 Flash (via OpenRouter) conducts a structured interview — one question at a time — probing onset, duration, severity, location and associated symptoms.
3. After a maximum of 5 patient turns (or sooner when the picture is clear), the AI produces:
   - A **clinical summary** passed to the MO queue
   - An **ESI level (1–5)** with a one-sentence rationale
4. **Red-flag symptoms** (chest pain, stroke signs, severe bleeding, suicidal ideation) trigger an immediate ESI 1/2 response and redirect to the SOS screen.
5. Interviews are conducted in **Bahasa Malaysia or English** — the AI matches the patient's language.

| ESI Level | Meaning |
|---|---|
| 1 | Resuscitation — immediate life threat |
| 2 | Emergent — high risk, severe distress |
| 3 | Urgent — needs multiple resources, stable |
| 4 | Less urgent — one resource expected |
| 5 | Non-urgent — self-care candidate |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A Supabase project (for auth and database)
- An OpenRouter API key (for AI consultation)

### Installation

```bash
git clone https://github.com/maumau1x1/SeHAT-Smart-e-Health-Automation-Triage.git
cd SeHAT-Smart-e-Health-Automation-Triage
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
LMAO_OPENROUTER=your_openrouter_api_key
```

### Development

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

---

## Deployment

SeHAT is configured for **Cloudflare Pages** via `@cloudflare/vite-plugin`. Run `npm run build` and deploy the `dist/` output to Cloudflare Pages, ensuring the environment variables above are set in the Cloudflare dashboard.

---

## Role Access

| Route | Role |
|---|---|
| `/` `/consultation` `/clinics` `/heatmap` `/visits` `/medications` `/sos` | Patient |
| `/mo` `/mo/:id` | Medical Officer |
| `/pharmacy` `/pharmacy/:id` | Pharmacist |
| `/checkin/:token` | Shared (QR scan) |
| `/report/:id` | Shared |

---

## Built With

This project was developed as part of a hackathon (Track 2 — Clinician Copilot) at Lovable ft. OpenClaw KL Hackathon.

---

## Licence

This project is for educational and demonstration purposes.
