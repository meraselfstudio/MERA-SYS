# 1. ARSITEKTUR SISTEM MÉRA OS

## 1.1 Overview Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                     MÉRA OS - FRONTEND (React)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │     POS      │   Absensi    │  Photobooth  │   Finance    │  │
│  │   Module     │    Module    │   Module     │   Module     │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
│           ↓                                           ↓           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Context API + Custom Hooks (State)              │ │
│  │  - AuthContext (PIN validation)                           │ │
│  │  - TransactionContext (POS, Absensi, Finance)             │ │
│  │  - BookingContext (Real-time booking updates)             │ │
│  │  - PhotoboothContext (Session capture state)              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Sidebar Navigation (Collapsible)              │ │
│  │  - Module switcher                                         │ │
│  │  - Quick stats                                             │ │
│  │  - User login/logout                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         ↓              ↓              ↓              ↓
    ┌─────────────────────────────────────────────────────┐
    │           SUPABASE BACKEND (Real-time)              │
    ├─────────────────────────────────────────────────────┤
    │  PostgreSQL Database | Realtime Subscriptions       │
    │  Storage (Photo, Slip, Laporan)                     │
    │  Auth (PIN validation via RPC functions)            │
    └─────────────────────────────────────────────────────┘
         ↓              ↓              ↓              ↓
    ┌─────────────────────────────────────────────────────┐
    │        GOOGLE DRIVE (Backup & Archives)             │
    │  - Auto-backup slip gaji                            │
    │  - Archive monthly reports                          │
    │  - Photo backup (longterm storage)                  │
    └─────────────────────────────────────────────────────┘
```

## 1.2 Component Architecture

### A. Module Hierarchy

```
App.jsx
├── Layout
│   ├── Sidebar (Collapsible Navigation)
│   │   ├── ModuleSelector
│   │   ├── QuickStats
│   │   └── UserMenu
│   │
│   └── MainContent
│       ├── POS Module (pos.jsx)
│       │   ├── ProductList (dengan filter kategori)
│       │   ├── ShoppingCart
│       │   ├── CustomerForm
│       │   ├── PaymentForm
│       │   └── Receipt (thermal printer)
│       │
│       ├── Absensi Module (absensi.jsx)
│       │   ├── CrewSelector
│       │   ├── ShiftSelector
│       │   ├── WebcamCapture (In/Out)
│       │   ├── OmsetVerification
│       │   └── GajiBersihDisplay
│       │
│       ├── Photobooth Module (photobooth.jsx - fullscreen route)
│       │   ├── StandbyScreen
│       │   ├── CaptureFlow
│       │   ├── ProcessingScreen
│       │   ├── ReviewScreen
│       │   ├── EditorCanvas
│       │   └── FinalDownload
│       │
│       ├── Finance Module (finance.jsx - PIN protected)
│       │   ├── PINPad
│       │   ├── Dashboard (Revenue, Profit, Cash, QRIS)
│       │   ├── ExpenseForm
│       │   ├── CrewPayrollTable
│       │   ├── TransactionList
│       │   └── ReportDownload
│       │
│       └── Booking Module (booking.jsx)
│           ├── BookingForm (customer booking)
│           ├── CheckInQR
│           ├── ScheduleMonitor (crew view)
│           └── BookingActions (reschedule, cancel)
```

### B. Context Structure

```
AuthContext
├── userRole (kasir, crew, sweeper, admin)
├── isAuthenticated
├── isPINValid (finansial)
└── currentUser

TransactionContext
├── transactions[] (POS + attendance)
├── expenses[]
├── payrollData[]
├── sessionOmset (daily)
└── addTransaction(), addExpense(), etc.

BookingContext
├── bookings[]
├── activeBookings (real-time)
├── expiredBookings
└── updateBookingStatus()

PhotoboothContext
├── capturedPhotos[]
├── currentSession
├── canvasState
└── saveSession()
```

## 1.3 Data Flow Patterns

### A. POS Transaction Flow

```
Customer Input
    ↓
Select Products → Add to Cart → Choose Payment Method
    ↓
Validate Payment (canPay check)
    ↓
POST /api/transactions (Supabase)
    ↓
Generate Receipt (local print)
    ↓
Update omset (TransactionContext)
    ↓
Sync to Finance Dashboard (real-time)
```

### B. Absensi Flow

```
Crew PIN Selection
    ↓
Choose Shift (weekday/weekend calculator)
    ↓
IN: Webcam Photo Capture
    ↓
POST /api/attendance/in + photo to Storage
    ↓
[Working Hours...]
    ↓
OUT: Verify Daily Omset (cash receipt check)
    ↓
POST /api/attendance/out + calculate gaji
    ├── Base salary (by shift)
    ├── Keterlambatan potongan (-5000/10min from hour 11)
    ├── Bonus tim (20000 + 5000 per 50k omset)
    └── Total gaji bersih
    ↓
Send to Finance Dashboard (live update)
    ↓
Generate & store slip gaji (PDF)
```

### C. Photobooth Flow

```
Enter Photobooth (private route: /photobooth)
    ↓
Standby → Press START
    ↓
Countdown 3s → SNAP (freeze 2s)
    ↓
Grid Progress (1-6 foto)
    ↓
Auto → Review Screen (strip 4R)
    ↓
Edit Mode (drawing canvas + stickers)
    ↓
SAVE → Upload to Storage + download JPEG
    ↓
PIN 8080 → Return to crew dashboard
```

### D. Finance Dashboard Flow

```
LOGIN (PIN: ////)
    ↓
Fetch all transactions + expenses (real-time)
    ↓
Calculate:
├── Total Revenue (semua POS)
├── Total Expenses
├── Net Profit (Revenue - Expenses)
├── Cash Today, QRIS Today
├── Booking vs OTS ratio
│
├── Crew Payroll (dari attendance logs)
│   ├── Total dikeluarkan
│   ├── Breakdown per crew
│   └── Bonus distribution
│
└── Generate Reports
    ├── Slip Gaji (PDF)
    └── Monthly Report (Excel/PDF)
```

### E. Booking Flow

```
PUBLIC: Customer Booking (link terpisah)
    ├── Select Package, Date, Time
    ├── Choose: "Full Payment" (QRIS) / "Keep Slot" (6h validity)
    └── POST /api/bookings (status: PAID or KEEPSLOT)
            ↓
        Send Tiket Digital (QR Code)
            ↓
        STUDIO: Scan QR → Status ARRIVED
            ↓
        POS: Confirm Payment → Status PAID_AND_IN_STUDIO
            ↓
        NOTIF to kasir (real-time)

CREW: Schedule Monitor (sweeper)
    ├── View all KEEPSLOT bookings with countdown
    ├── Auto-expire mechanism (6h)
    └── Cancel/Reschedule actions
```

## 1.4 Layer Architecture

### Presentation Layer (React Components)
- Modular components per modul
- Responsive design (mobile/tablet/desktop)
- Dark mode + Light mode support
- Golden ratio scaling

### Business Logic Layer (Context + Hooks)
- State management (TransactionContext, AuthContext, etc.)
- Validation logic (canPay, pinValidation, etc.)
- Calculations (gaji, bonus, keterlambatan)
- Real-time subscription handlers

### Data Access Layer (Supabase SDK)
- Direct API calls via `supabase` client
- Real-time listeners (`.on('*')`)
- File uploads to Storage
- RPC calls untuk logika kompleks

### External Integration
- Google Drive API (backup)
- QR Code generation (qrcode.react)
- Thermal printer (react-thermal-printer)
- Webcam access (mediaDevices API)

## 1.5 State Management Strategy

```
Global State (Context)
├── Auth (PIN validation, user role)
├── Transaction (POS, omset tracking)
├── Crew Attendance
├── Booking Status
└── Photobooth Session

Local State (Component)
├── Form fields
├── UI toggles (sidebar, modals)
├── Canvas drawing state
└── Webcam stream

Server State (Supabase)
├── All persistent data
├── Real-time subscriptions
├── Photo storage references
└── Transaction logs
```

## 1.6 Real-time Sync Architecture

```
Client (React + Context)
        ↓
Supabase Realtime Channels
        ↓
Database (PostgreSQL)
        ↓
Broadcasting back to all connected clients

Example:
- POS creates transaction → Realtime event → Finance dashboard updates live
- Attendance OUT → Gaji calculated → Slip generated automatically
- Booking canceled → Schedule monitor updates instantly
```

## 1.7 Responsive Design Strategy

### Breakpoints
```css
Mobile: 320px - 768px
Tablet: 768px - 1024px
Desktop: 1024px+
```

### Golden Ratio Implementation (1.618)
```
Base unit: 16px
├── Small (s): 9px
├── Medium (m): 16px
├── Large (l): 26px
├── XL: 42px
├── XXL: 68px
└── Spacing follows 1.618 ratio
```

### Layout Adaptation
- **Mobile**: Sidebar menggunakan hamburger toggle
- **Tablet**: Sidebar collapsible, content full width
- **Desktop**: Sidebar tetap visible (collapse-toggle), content responsive

## 1.8 Security Architecture

```
Entry Points:
├── POS (no auth needed - clerk/kasir interface)
├── Absensi (PIN-less, visual crew selection)
├── Photobooth (PIN 8080 untuk escape)
├── Finance (PIN: //// required)
└── Booking Monitor (crew/sweeper role-based)

PIN Validation Flow:
├── PIN input → hash (bcrypt - server-side RPC)
├── Compare with stored hash (if stored in DB)
├── OR: hardcoded PIN validation (local - untuk MVP)
└── Set PIN validity flag dalam context (time-limited)
```

---

**Next**: Lihat `2-database-schema.md` untuk spesifikasi database lengkap.
