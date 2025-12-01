## Technical Specification – Nantika Physical Thai Massage Front-End

### **1. Architecture Overview**

- **Framework**: Next.js App Router (React, TypeScript).
- **Styling**: Tailwind CSS + small amount of custom CSS (`globals.css`).
- **State Management**:
  - Local React state per screen.
  - Custom React Context for global therapist login/queue state (`TherapistStatusContext`).
  - Custom React Context for i18n (`LanguageContext`).
- **Charting**: `recharts` for pie charts and tables on manager analytics tabs.
- **Persistence (current prototype)**:
  - In-memory data structures (mock therapists, services, entries).
  - `localStorage` for:
    - Logged-in therapists.
    - Public display board sync (`serviceBoardData`).

Backend integration is **not yet implemented**; this spec anticipates future API endpoints.

---

### **2. Key Data Models (Front-End)**

#### **2.1 ServiceEntry (Daily Matrix)**

```ts
interface ServiceEntry {
  id: string               // unique per entry
  therapist: string        // therapist name
  service: string          // e.g. "Thai 400"
  price: number            // total price including add-ons
  time: string             // start/assignment time "HH:MM"
  endTime?: string         // optional end time "HH:MM" when service is closed
  column: number           // column index/row slot
  round: number            // round-robin cycle this entry belongs to
}
```

#### **2.2 TherapistData (Manager Daily Matrix & Display)**

```ts
interface TherapistData {
  name: string
  certifiedServices?: string[]  // array of Service IDs therapist can perform
  commissionRate?: number       // % commission used for payout calculations
}
```

#### **2.3 Service (Services Management)**

```ts
interface Service {
  id: string
  name: string
  category?: string
  price: number
  duration?: number      // minutes, used for expected end time on display
  isActive: boolean
}
```

#### **2.4 Therapist (Therapist Management)**

```ts
interface Therapist {
  id: string
  name: string
  phone: string
  email?: string
  pin: string
  status: 'active' | 'inactive'
  commissionRate?: number
  joinDate: string              // ISO date string
  certifiedServices?: string[]  // Service IDs
}
```

#### **2.5 TherapistStatusContext State**

```ts
interface TherapistStatusContextType {
  loggedInTherapists: string[]                  // therapist names
  loginTherapist: (therapistName: string) => void
  logoutTherapist: (therapistName: string) => void
  isLoggedIn: (therapistName: string) => boolean
}
```

---

### **3. Global Contexts & Providers**

#### **3.1 LanguageContext**

- **Purpose**: i18n for English and Thai text.
- **Features**:
  - `LanguageProvider` wraps the app.
  - `useLanguage()` hook exposes:
    - `t(key: string) => string`
    - `language` and `setLanguage`.
  - Language preference persisted in `localStorage`.

#### **3.2 TherapistStatusContext**

- **Purpose**: Track therapists who are clocked in and maintain a shared queue state.
- **Implementation**:
  - Stores `loggedInTherapists` array in `localStorage` on each update.
  - Emits `CustomEvent('therapistStatusChanged', { detail: { loggedInTherapists } })` to notify other tabs/components.
  - `useTherapistStatus()` hook throws if used outside provider.
  - Used by:
    - Therapist login and home pages.
    - Manager Daily Matrix (to filter queue).
    - Public display board (`/display`).

#### **3.3 Providers Composition**

- Root layout (`app/layout.tsx`) wraps children with:
  - `LanguageProviderWrapper` (which itself wraps `LanguageProvider` and `TherapistStatusProvider`).

---

### **4. Daily Matrix Logic (Manager)**

#### **4.1 Queue & Round-Robin**

- `therapistQueue: string[]` – ordered list of therapist names currently in queue.
- `nextTherapistIndex: number` – index in `therapistQueue` of the next candidate for auto-assignment.
- `roundServiceCounts: Record<string, number>` – number of services per therapist in the **current** round.
- `currentRound: number` – current round-robin cycle.

**Queue Updates:**

- On therapist status change:
  - Queue recomputed to include only therapists who:
    - Are in `loggedInTherapists`.
    - Have at least one certified service.
  - Existing order is preserved for still-logged-in therapists; new ones are appended.
  - `nextTherapistIndex` is reset when needed.

**Round Completion:**

- When a new entry is added:
  - `roundServiceCounts[therapist]` incremented.
  - If all active therapists have `> 0` services in current round:
    - Round considered complete.
    - `roundServiceCounts` reset.
    - `therapistQueue` reset to full logged-in set.
    - `nextTherapistIndex` reset to `0`.
    - `currentRound++`.

#### **4.2 Service-Driven Assignment**

- `getNextTherapistForService(serviceId: string)`:
  - Computes `busyTherapists` from `serviceEntries` lacking `endTime`.
  - Filters `therapistQueue` to therapists who:
    - Are certified for `serviceId`.
    - Are **not** in `busyTherapists`.
  - Prefers:
    1. Therapist at `nextTherapistIndex` if certified and free.
    2. First certified therapist in queue who has `0` services in current round.
    3. Fallback: first certified therapist in queue.
  - Returns therapist name or `null`.

- `handleAddEntry(entry)`:
  - Extracts `serviceName` and `serviceId`.
  - Validates/adjusts assigned therapist:
    - For auto mode, re-selects therapist via `getNextTherapistForService` if original assignment is not certified.
  - Computes:
    - `nextColumn` per therapist.
    - `entryRound` based on `currentRound` and existing entries.
  - Creates `ServiceEntry` with:
    - `time` as current local time `HH:MM` (24h).
    - `round`.
  - Updates:
    - Round counts and `currentRound` (if round completed).
    - `therapistQueue`: assigned therapist is moved to the **back** of queue in auto mode.

#### **4.3 Busy / Availability**

- A therapist is considered **busy** when there is at least one `ServiceEntry` for them with `endTime` **undefined**.
- Busy therapists:
  - Are **filtered out** by `getNextTherapistForService`.
  - Remain in the queue for visualization but cannot receive new auto-assignments until their service is ended.

#### **4.4 Service Start/End**

- When a new entry is created:
  - `time` set to start time (assignment time).
  - `endTime` is `undefined`.
- `handleEndService(entryId)`:
  - Sets `endTime` to current time.
  - This frees the therapist for future assignments.

#### **4.5 Matrix Rendering**

- Table per round:
  - **Rows**: `therapistQueue`.
  - **Columns**:
    - Assignment Time: `getAssignmentTime(therapist, round)` (earliest time for that therapist and round).
    - Therapist + queue position + check-in time.
    - Service columns:
      - Compute `entriesForCell`, `activeEntries`, `completedEntries`.
      - Determine `isCertified` by comparing therapist’s `certifiedServices` with `availableServices[].id`.
      - **Styling**:
        - Certified: green (`bg-brand-green-50`, `text-brand-green-800`, `border-brand-green-200`).
        - Not certified: red (`bg-red-50`, `text-red-500`, `border-red-200`).
      - For non-certified cells, always display `—` (no content).
      - For certified cells:
        - Completed entries show service name, price, start/end time.
        - Active entries show “In Progress” and an **End Service** button.
    - Rightmost column: Round total via `getTherapistRoundTotal`.

---

### **5. Therapist Interface Logic**

#### **5.1 Login (`/therapist/login`)**

- `mockTherapists` list stores name, phone, PIN.
- On submit:
  - Match by phone or case-insensitive name.
  - Validate PIN.
  - `loginTherapist(therapist.name)` updates `TherapistStatusContext`.
  - Persist current therapist name in `sessionStorage` under `currentTherapist`.
  - Navigate to `/therapist/home`.

#### **5.2 Home (`/therapist/home`)**

- On mount:
  - Load `currentTherapist` from `sessionStorage`.
  - Redirect to login if missing.
  - Look up `TherapistData` (mirrored from manager side) and map `certifiedServices` to a list of services (`availableServices`) for the “My Certified Services” section.

- Buttons:
  - **Clock Out / Check Out**:
    - `logoutTherapist(therapistName)` in context.
    - Remove `currentTherapist` from `sessionStorage`.
    - Redirect to `/therapist/login`.
  - **Close Screen (Stay Clocked In)**:
    - Remove only `currentTherapist` from `sessionStorage`.
    - Redirect to `/therapist/login`.
    - Does **not** call `logoutTherapist` so they remain in queue.

---

### **6. Public Display Board (`/display`)**

#### **6.1 Data Synchronization**

- Manager Daily Matrix publishes a payload on relevant state changes:

```ts
const payload = { serviceEntries, therapistQueue, nextTherapistIndex }
localStorage.setItem('serviceBoardData', JSON.stringify(payload))
window.dispatchEvent(new CustomEvent('serviceBoardDataChanged', { detail: payload }))
```

- Display page (`/display`) subscribes to:
  - `serviceBoardDataChanged` – to receive updated entries and queue.
  - `therapistStatusChanged` – to update logged-in therapists.

- On mount:
  - Reads initial `serviceBoardData` and `loggedInTherapists` from `localStorage`.

#### **6.2 Now Performing & Expected End Time**

- `activeServices = serviceEntries.filter(e => !e.endTime)`.
- Service durations configured locally:

```ts
const serviceDurations = [{ name: 'Thai', duration: 60 }, ...]
```

- `getExpectedEndTime(entry)`:
  - Extract service name.
  - Look up duration.
  - Parse `entry.time` as `HH:MM`, add duration minutes, and format back as `HH:MM`.

#### **6.3 Therapist Queue View**

- Uses `therapistQueue`, `nextTherapistIndex`, `loggedInTherapists`:
  - Builds `queue` and `extraLoggedIn` (logged-in but not in queue).
  - `busyTherapists` computed from `activeServices`.
  - For each therapist:
    - Shows queue position, name, “Next” badge if `index === nextTherapistIndex` and not busy, “In Service” badge if busy.
    - Computes certified services using a local copy of `therapistsData` + `availableServices` to render skill chips.

---

### **7. Internationalization & Theming**

- **Translations**:
  - Keys for manager, therapist, common labels stored in `LanguageContext`.
  - `LanguagePicker` component toggles language and writes preference to `localStorage`.

- **Theming / Tailwind**:
  - `tailwind.config.js` extends colors with:
    - `brand-green-{50..900}` and `brand-blue-{50..900}`.
  - `globals.css` sets base background and CSS variables for brand colors.
  - All screens use new brand colors for consistency.

---

### **8. Future Backend Integration (Outline)**

This prototype assumes future APIs; suggested endpoints:

- `GET /api/therapists` – list therapists with certifications and status.
- `POST /api/therapists/login` – authenticate & clock in.
- `POST /api/therapists/logout` – clock out.
- `GET /api/services` – list services with durations and pricing.
- `POST /api/entries` – create a service entry.
- `PATCH /api/entries/:id` – update (e.g., end service).
- `GET /api/entries?date=...` – fetch daily matrix data.

Front-end logic is already structured around clear models (`ServiceEntry`, `Therapist`, `Service`) to support swapping mock data with API calls later.


