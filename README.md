# Massage App - Service Management System

A Next.js application for managing massage services with separate interfaces for managers and therapists.

## Features

### Manager Interface (Front Desk)
- **Daily Matrix View**: Visual grid showing all therapists and their sessions
- **Add Entry Modal**: Quick service entry with full control over pricing, add-ons, and payment methods
- **Real-time Totals**: Automatic calculation of therapist and shop totals
- **Therapist Management**: Create and edit therapist profiles
- **Shift Assignment**: Assign working hours and shifts for each therapist
- **Payout Tracking**: Track daily, weekly, and monthly totals with commission calculations

### Therapist Interface (Mobile Web)
- **Therapist Login**: Simple phone/ID and PIN authentication
- **Home Screen**: Quick overview of today's sessions and earnings
- **New Session Form**: Fast service entry optimized for mobile
- **Daily Summary**: Detailed stats and history for the day

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
massageApp/
├── app/
│   ├── manager/                    # Manager interface pages
│   │   ├── page.tsx                # Daily Matrix view
│   │   ├── reports/                # Reports page
│   │   └── therapists/             # Therapist management
│   │       ├── page.tsx            # Therapist list
│   │       └── [id]/               # Individual therapist
│   │           ├── shifts/         # Shift assignment
│   │           └── payout/         # Payout & totals
│   ├── therapist/                  # Therapist interface pages
│   │   ├── login/                  # Login page
│   │   ├── home/                   # Home dashboard
│   │   ├── new-session/            # New session form
│   │   └── summary/                # Daily summary
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing page
│   └── globals.css                 # Global styles
├── components/
│   ├── AddEntryModal.tsx           # Manager entry modal
│   └── TherapistProfileModal.tsx   # Therapist profile modal
└── package.json
```

## Routes

### Manager Routes
- `/` - Landing page with role selection
- `/manager` - Manager Daily Matrix view
- `/manager/therapists` - Therapist Management (list, create, edit)
- `/manager/therapists/[id]/shifts` - Assign working hours/shifts
- `/manager/therapists/[id]/payout` - View totals and payout (daily/weekly/monthly)
- `/manager/reports` - Reports page

### Therapist Routes
- `/therapist/login` - Therapist login
- `/therapist/home` - Therapist home dashboard
- `/therapist/new-session` - New session entry form
- `/therapist/summary` - Daily summary and stats

## Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Next Steps

To make this production-ready, you'll need to:

1. Set up a backend API (e.g., Next.js API routes or separate backend)
2. Implement authentication and session management
3. Connect to a database (PostgreSQL, MongoDB, etc.)
4. Add real-time updates (WebSockets or Server-Sent Events)
5. Implement offline support for therapists
6. Add QR code scanning functionality
7. Set up proper error handling and validation

