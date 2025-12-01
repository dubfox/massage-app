## Nantika Physical Thai Massage – Front-End Scope (Client View)

### **1. What This System Does**

- **Goal**: Make it easy for Nantika to manage therapists, services, and daily operations, while giving staff and customers clear visibility into who is working and which services are being performed.
- **Main Parts**:
  - **Manager Interface** (front desk / owner)
  - **Therapist Interface** (kiosk inside the shop)
  - **Public Display Screen** (TV/monitor in the shop)

---

### **2. Manager Interface (Front Desk)**

#### **2.1 Landing & Navigation**

- Branded landing page for **Nantika Physical Thai Massage**.
- Three main buttons:
  - **Manager Interface** – for front desk.
  - **Therapist Interface** – for therapist kiosk login.
  - **Live Service Board (Shop Display)** – for big screen in the shop.
- Language picker for **English / Thai**.

#### **2.2 Daily Matrix – Service Assignment**

- Main screen where the manager assigns services to therapists.
- **Round-robin logic**:
  - Each round gives **one service to each therapist** before the next round starts.
  - Rounds are shown as separate “Entry Sheets”, newest round at the top.
- **Rows**: therapists (in queue order) with:
  - Name and position in the queue.
  - “Next” label for the next therapist.
  - Check-in time.
- **Columns**:
  - Service Assignment Time.
  - Therapist.
  - A column for each service (Thai, Foot, Oil, etc.).
  - Total amount for the round per therapist.

#### **2.3 Skills & Eligibility (Green / Red Cells)**

- Each therapist has a list of **services they are certified to perform**.
- In the daily matrix:
  - **Green cells** – services the therapist **can** perform.
  - **Red cells** – services the therapist **cannot** perform (no assignments there).
- This gives a clear visual grid of allowed vs. not allowed services for every therapist.

#### **2.4 Manager Service Entry (Modal)**

- Manager clicks **Add Entry** to assign a service.
- Fields:
  - Service type (Thai, Foot, etc.).
  - Therapist (auto-selected by the system in round-robin).
  - Time slot (auto or a specific row).
  - Price and add-ons.
  - Payment type (cash/card/QR/unpaid).
  - Notes.
- **Service-driven assignment**:
  - Manager picks the **service first**.
  - System automatically picks the **next therapist in the queue** who:
    - Is **clocked in**.
    - Is **certified** for that service.
    - Is **not currently busy** on another service.

#### **2.5 Service Start / End Control**

- When a service is assigned:
  - The system records **start time**.
  - The therapist is marked as **busy** (not available for new services).
- When the service ends:
  - Manager clicks **End Service** in the table.
  - The system records **end time**.
  - The therapist becomes **available in the queue** again.

#### **2.6 Analytics Tabs**

- On the Daily Matrix screen there are extra tabs:
  - **Service Chart**:
    - Pie chart and table showing how many of each service type were done and their revenue.
  - **Therapist Revenue**:
    - Pie chart and table showing how much each therapist generated, including therapist commission vs. store share.

---

### **3. Therapist Management**

- List of all therapists with:
  - Name, phone, commission rate, status (active/inactive), join date.
- Actions for each therapist:
  - **Edit profile** (name, contact details, PIN, status, commission).
  - **Certified services** – which services they can perform.
  - **Assign shifts** (separate page).
  - **View payout / totals** (separate page).
- **Clock Status**:
  - Manager can **Check In** or **Check Out** therapists.
  - This adds/removes them from the round-robin queue.

---

### **4. Services Management**

- Screen to manage all services offered in the shop.
- Details for each service:
  - Name, category, price, duration, active/inactive.
- Manager can:
  - Add new services.
  - Edit existing services (fields pre-filled).
  - Activate/deactivate services.

---

### **5. Therapist Interface (Kiosk)**

#### **5.1 Therapist Login**

- Simple login on a kiosk or tablet in the shop.
- Therapists log in with **ID/Phone + PIN**.
- After login:
  - System **clocks them in** and adds them to the queue.
  - They are redirected to the Therapist Home screen.

#### **5.2 Therapist Home**

- Shows:
  - Greeting and today’s date.
  - Badge: “Clocked In – Active in Queue”.
  - List of **services this therapist is certified to perform**.
  - Summary of today’s sessions (currently demo numbers).
- Buttons:
  - **Clock Out / Check Out** – removes them from the queue and logs them out.
  - **Close Screen (Stay Clocked In)** – returns to login but keeps them **active in the queue**.

> Note: In this phase, therapists do **not** create their own sessions. All service entries are made by the manager.

---

### **6. Public Display – Live Service Board**

- Dedicated screen for a **TV/monitor in the shop**.
- Shows **no prices or financial data** – safe for customers.

#### **6.1 Now Performing**

- List of currently active services:
  - Therapist name.
  - Service type.
  - Start time.
  - Expected end time (based on service duration).

#### **6.2 Therapist Queue**

- List of therapists in the service queue:
  - Position, name.
  - Badge for **Next** and **In Service**.
  - Service chips showing **which services each therapist can perform**.

---

### **7. Branding & Languages**

- Colors aligned with Nantika’s brand:
  - Vibrant green, blue accents, white, dark grey/black.
- All main screens support **English and Thai** via a language switcher.

---

### **8. Key Benefits for Nantika**

- Fair and transparent **round-robin** assignment of services.
- Clear view of **who can perform which services** (green/red matrix cells and skill chips).
- Easy **clock-in/clock-out** for therapists and manager overrides.
- **Live display** for customers and staff without showing any payment details.
- Foundation ready for future expansion (more reports, real data from backend, etc.).


