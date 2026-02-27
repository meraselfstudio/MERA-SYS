# 5. TECHNICAL SPECIFICATIONS - MÉRA OS

## 5.1 Technology Stack

### Frontend Stack

```
Framework & Library:
├─ React 18.3+           (JavaScript library for UI)
├─ React Router v6.x    (client-side routing)
├─ Vite 5.x             (build tool, fast dev server)
└─ TypeScript 5.x       (optional, for type safety)

State Management:
├─ React Context API    (global state - Auth, Transaction, Booking)
├─ useReducer Hook      (complex state logic)
├─ Custom Hooks         (reusable logic)
└─ localStorage         (persistent state, offline capability)

UI & Styling:
├─ Tailwind CSS 3.x     (utility-first CSS)
├─ PostCSS              (CSS processing)
├─ Responsive design    (mobile-first approach)
└─ Dark mode support    (via Tailwind class strategy)

Components & Libraries:
├─ react-papaparse      (CSV parsing for products/crew)
├─ recharts 2.x         (charts for Finance dashboard)
├─ qrcode.react         (QR code generation)
├─ react-thermal-printer (thermal receipt printing)
├─ html2canvas          (canvas to image export)
├─ date-fns             (date manipulation)
└─ lucide-react         (SVG icons)

Real-time & Communication:
├─ @supabase/supabase-js (Supabase client SDK)
├─ Realtime subscriptions (for live updates)
└─ Polling fallback     (if websocket unavailable)

Canvas & Media:
├─ HTML5 Canvas API     (drawing, image manipulation)
├─ MediaDevices API     (webcam access)
├─ Canvas Filters       (optional image effects)
└─ Blob API             (image data handling)

Build & Dev Tools:
├─ npm or pnpm          (package manager)
├─ ESLint               (code linting)
├─ Prettier             (code formatting)
└─ Vitest or Jest       (testing framework)
```

### Backend Stack

```
Platform:
├─ Supabase             (Backend-as-a-Service)
│  ├─ PostgreSQL       (database)
│  ├─ Auth             (authentication)
│  ├─ Realtime         (live subscriptions)
│  ├─ Storage          (file upload: photos, PDFs)
│  ├─ Edge Functions   (serverless functions)
│  └─ Vector DB        (optional, for search)

Database:
├─ PostgreSQL 15+      (relational database)
├─ PostGIS             (optional, for geolocation)
└─ pgVector            (optional, for vector search)

External Services:
├─ Google Drive API    (backup & archival)
├─ Google Docs/Sheets  (optional reporting)
├─ Twilio/WhatsApp     (optional: SMS notifications)
│  └─ Alternatives: Firebase Cloud Messaging
├─ QR Code Generator   (online or lib)
└─ Email Service       (SendGrid, Resend, or SMTP)
```

### DevOps & Deployment

```
Hosting:
├─ Vercel              (Recommended for React SPA)
│  ├─ Auto deploy from GitHub
│  ├─ Serverless functions (if needed)
│  ├─ Edge functions support
│  └─ Zero-config TypeScript
├─ Netlify             (Alternative)
├─ Self-hosted         (Docker + Nginx/Caddy)
└─ Railway             (Simple deployment)

Database Hosting:
├─ Supabase Cloud      (Managed PostgreSQL)
├─ AWS RDS PostgreSQL (Self-managed)
└─ Digital Ocean Database (Managed alternative)

Storage:
├─ Supabase Storage    (Object storage - main)
├─ AWS S3              (Alternative)
└─ Google Cloud Storage (Alternative)

CI/CD:
├─ GitHub Actions      (Free, integrated with GitHub)
├─ Railway Deploy      (Simple config)
└─ Manual deploy       (Vercel CLI or git push)

Monitoring & Logging:
├─ Vercel Analytics    (deployment monitoring)
├─ Sentry              (error tracking)
├─ LogDNA or Datadog   (log aggregation)
└─ Supabase Logs       (database query logs)
```

## 5.2 Project Structure

```
mera-os/
├── docs/                          # Dokumentasi lengkap
│   ├── 1-architecture.md
│   ├── 2-database-schema.md
│   ├── 3-data-flows.md
│   ├── 4-ui-ux-wireframes.md
│   ├── 5-technical-specs.md (ini)
│   ├── 6-security.md
│   ├── 7-api-endpoints.md
│   └── 8-deployment.md
│
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   │
│   │   ├── Common/
│   │   │   ├── Modal.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── NotificationToast.jsx
│   │   │
│   │   ├── POS/
│   │   │   ├── POSModule.jsx
│   │   │   ├── ProductList.jsx
│   │   │   ├── ProductFilter.jsx
│   │   │   ├── ShoppingCart.jsx
│   │   │   ├── CustomerForm.jsx
│   │   │   ├── PaymentForm.jsx
│   │   │   ├── Receipt.jsx
│   │   │   └── ThermalPrinter.jsx
│   │   │
│   │   ├── Absensi/
│   │   │   ├── AbsensiModule.jsx
│   │   │   ├── CrewSelector.jsx
│   │   │   ├── ShiftSelector.jsx
│   │   │   ├── WebcamCapture.jsx
│   │   │   ├── OmsetVerification.jsx
│   │   │   ├── GajiSlip.jsx
│   │   │   └── AttendanceMonitor.jsx
│   │   │
│   │   ├── Photobooth/
│   │   │   ├── PhotoboothModule.jsx
│   │   │   ├── StandbyScreen.jsx
│   │   │   ├── CaptureFlow.jsx
│   │   │   ├── ReviewScreen.jsx
│   │   │   ├── EditingCanvas.jsx
│   │   │   ├── StickerPanel.jsx
│   │   │   └── DownloadScreen.jsx
│   │   │
│   │   ├── Finance/
│   │   │   ├── FinanceModule.jsx
│   │   │   ├── PINPad.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── KPICards.jsx
│   │   │   ├── PayrollTable.jsx
│   │   │   ├── TransactionList.jsx
│   │   │   ├── ExpenseForm.jsx
│   │   │   ├── Charts.jsx
│   │   │   └── ReportDownload.jsx
│   │   │
│   │   └── Booking/
│   │       ├── BookingModule.jsx
│   │       ├── PublicBookingForm.jsx
│   │       ├── BookingReview.jsx
│   │       ├── QRScanner.jsx
│   │       ├── ScheduleMonitor.jsx
│   │       └── BookingActions.jsx
│   │
│   ├── context/
│   │   ├── AuthContext.js         # PIN validation, user role
│   │   ├── TransactionContext.js  # POS, omset, expenses
│   │   ├── BookingContext.js      # Booking status & real-time
│   │   ├── PhotoboothContext.js   # Session state
│   │   └── NotificationContext.js # Toast/alerts
│   │
│   ├── hooks/
│   │   ├── useSupabase.js         # Supabase client wrapper
│   │   ├── useLocalStorage.js     # localStorage persistence
│   │   ├── useRealtime.js         # Realtime subscriptions
│   │   ├── useAuth.js             # Auth logic
│   │   ├── useTransaction.js      # Transaction logic
│   │   ├── useWebcam.js           # Webcam access
│   │   ├── useCanvas.js           # Canvas utilities
│   │   └── usePrint.js            # Print utilities
│   │
│   ├── services/
│   │   ├── supabaseClient.js      # Supabase initialization
│   │   ├── api/
│   │   │   ├── transactions.js    # POST/GET transactions
│   │   │   ├── attendance.js      # Attendance API
│   │   │   ├── bookings.js        # Booking CRUD
│   │   │   ├── crew.js            # Crew data
│   │   │   ├── products.js        # Product data
│   │   │   ├── finance.js         # Finance queries
│   │   │   └── storage.js         # Photo upload/download
│   │   │
│   │   ├── utils/
│   │   │   ├── csvParser.js       # PapaParse helpers
│   │   │   ├── calculations.js    # Gaji, omset, bonus calcs
│   │   │   ├── printers.js        # Thermal printer utility
│   │   │   ├── qrGenerator.js     # QR code generation
│   │   │   ├── imageProcessing.js # Canvas/image utils
│   │   │   ├── dateFormatter.js   # Date formatting
│   │   │   └── validators.js      # Input validation
│   │   │
│   │   └── auth/
│   │       └── pinValidator.js    # PIN hashing/validation
│   │
│   ├── styles/
│   │   ├── tailwind.config.js     # Tailwind configuration
│   │   ├── globals.css            # Global styles
│   │   ├── variables.css          # CSS custom properties (Golden ratio)
│   │   └── responsive.css         # Responsive utilities
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx          # Main dashboard (all modules)
│   │   ├── Photobooth.jsx         # Fullscreen photobooth route
│   │   ├── PublicBooking.jsx      # Public booking page
│   │   ├── NotFound.jsx
│   │   └── ErrorBoundary.jsx
│   │
│   ├── data/
│   │   ├── produk.csv             # Products data
│   │   └── crew.csv               # Crew data
│   │
│   ├── App.jsx                    # Main app component
│   ├── main.jsx                   # Entry point
│   └── index.css
│
├── public/
│   ├── logo.svg                   # Logo (MÉRA)
│   ├── favicon.ico
│   └── photobooth-assets/         # Stickers, templates
│
├── .env.example                   # Environment variables template
├── .env.local                     # (git ignored) Local development
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.json
├── .prettierrc
├── .gitignore
└── README.md                      # Main documentation

```

## 5.3 Environment Variables

```sh
# .env.example

# SUPABASE
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration
VITE_API_TIMEOUT=30000
VITE_API_RETRY_COUNT=3

# Feature Flags
VITE_ENABLE_THERMAL_PRINT=true
VITE_ENABLE_QR_SCAN=true
VITE_ENABLE_SOUND_EFFECTS=true
VITE_ENABLE_DARK_MODE=true

# PIN Configuration (only for development)
VITE_FINANCE_PIN=////
VITE_PHOTOBOOTH_PIN=8080

# Google Drive API (optional)
VITE_GOOGLE_DRIVE_FOLDER_ID=folder-id-here
VITE_GOOGLE_API_KEY=api-key-here

# Analytics (optional)
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_GOOGLE_ANALYTICS_ID=GA-ID

# Environment
VITE_ENVIRONMENT=development
NODE_ENV=development
```

## 5.4 Dependencies & Versions

```json
{
  "name": "mera-os",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx",
    "lint:fix": "eslint src --ext js,jsx --fix",
    "format": "prettier --write 'src/**/*.{js,jsx,css}'",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "db:push": "supabase db push",
    "db:pull": "supabase db pull"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.24.0",
    "@supabase/supabase-js": "^2.45.0",
    "papaparse": "^5.4.1",
    "recharts": "^2.10.0",
    "qrcode.react": "^1.0.1",
    "react-thermal-printer": "^1.0.0",
    "html2canvas": "^1.4.1",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.390.0",
    "clsx": "^2.1.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "eslint-config-react-app": "^7.0.0",
    "prettier": "^3.3.0",
    "typescript": "^5.4.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.0.0",
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.0"
  }
}
```

## 5.5 Key Implementation Details

### Context API Pattern

```javascript
// Example: TransactionContext
export const TransactionContext = createContext();

export function TransactionProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [omset, setOmset] = useState({ cash: 0, qris: 0, total: 0 });
  const [expenses, setExpenses] = useState([]);

  // Subscribe to real-time changes
  useEffect(() => {
    const subscription = supabase
      .from('transactions')
      .on('*', (payload) => {
        console.log('New transaction:', payload);
        fetchTodayTransactions();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  const addTransaction = async (data) => {
    const { data: newTx, error } = await supabase
      .from('transactions')
      .insert([data])
      .select();

    if (error) throw error;
    setTransactions([...transactions, newTx[0]]);
    return newTx[0];
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, omset }}>
      {children}
    </TransactionContext.Provider>
  );
}
```

### Supabase Realtime Pattern

```javascript
// Hook untuk real-time subscriptions
export function useRealtime(table, callback) {
  useEffect(() => {
    const subscription = supabase
      .from(table)
      .on('*', (payload) => {
        console.log(`Change detected in ${table}:`, payload);
        callback(payload);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [table, callback]);
}

// Usage in component
useRealtime('daily_omset_cache', (payload) => {
  updateDashboard(payload.new);
});
```

### Canvas Drawing Implementation

```javascript
// Photobooth canvas utilities
const useCanvas = (canvasRef) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    setContext(ctx);
  }, [canvasRef]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
    context.closePath();
  };

  return { startDrawing, draw, endDrawing };
};
```

### Payment Processing Flow

```javascript
// POS Payment Logic
const processPayment = async (cart, paymentMethod) => {
  // Validate transaction
  if (!canPay(cart)) {
    throw new Error('Invalid transaction');
  }

  // Create transaction record
  const transaction = {
    customer_id: customerId,
    tanggal: new Date(),
    jam: new Date(),
    tipe: bookingType,
    payment_method: paymentMethod,
    total_amount: calculateTotal(cart),
    items_json: cart,
    kasir_id: currentUserId,
  };

  // Insert to database
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select();

  if (error) throw error;

  // Generate receipt
  const receipt = generateReceipt(data[0]);

  // Print thermal
  if (printEnabled) {
    await printThermal(receipt);
  }

  // Update omset cache
  updateOmsetCache();

  return data[0];
};
```

### Attendance Gaji Calculation

```javascript
// Calculate gaji bersih saat crew OUT
const calculateGajiBersih = async (attendanceId) => {
  // Fetch attendance record
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('id', attendanceId)
    .single();

  // Calculate keterlambatan
  const potongan = calculateLatenessDeduction(
    attendance.jam_masuk,
    attendance.shift_start_time
  );

  // Calculate bonus tim
  const dailyOmset = await getDailyOmset(attendance.tanggal);
  const bonus = calculateTeamBonus(
    dailyOmset,
    attendance.shift_type
  );

  // Get number of crew (untuk distribusi bonus)
  const crewCount = await getCrewCountForDay(attendance.tanggal);
  const bonusPerCrew = Math.floor(bonus / crewCount);

  // Calculate gaji bersih
  const gajiBersih = attendance.gaji_pokok - potongan + bonusPerCrew;

  // Update attendance
  const { error } = await supabase
    .from('attendance')
    .update({
      potongan_keterlambatan: potongan,
      bonus_tim: bonusPerCrew,
      gaji_bersih: gajiBersih,
      status: 'FINALIZED',
    })
    .eq('id', attendanceId);

  // Generate slip
  generateGajiSlip(attendance, gajiBersih);

  return gajiBersih;
};
```

## 5.6 Build & Optimization

### Vite Configuration

```javascript
// vite.config.js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015',
    minify: 'terser',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'charts': ['recharts'],
          'ui': ['lucide-react'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_SUPABASE_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

### Bundle Size Optimization

```javascript
// Code splitting strategy
const POSModule = lazy(() => import('./components/POS/POSModule'));
const AbsensiModule = lazy(() => import('./components/Absensi/AbsensiModule'));
const PhotoboothModule = lazy(() => import('./components/Photobooth/PhotoboothModule'));
const FinanceModule = lazy(() => import('./components/Finance/FinanceModule'));
const BookingModule = lazy(() => import('./components/Booking/BookingModule'));

// Suspense boundary
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/pos" element={<POSModule />} />
    <Route path="/absensi" element={<AbsensiModule />} />
    {/* ... */}
  </Routes>
</Suspense>
```

## 5.7 Performance Metrics

### Target Metrics

```
Web Vitals:
├─ Largest Contentful Paint (LCP): < 2.5s
├─ First Input Delay (FID): < 100ms
├─ Cumulative Layout Shift (CLS): < 0.1
└─ Time to Interactive (TTI): < 3.5s

Bundle Size:
├─ Main bundle: < 150KB (gzipped)
├─ Total chunks: < 250KB (gzipped)
└─ Initial load: < 200KB

Database:
├─ Query response: < 100ms
├─ Realtime sync: < 500ms
└─ Concurrent users: 100+ simultaneously
```

### Optimization Strategies

```
Frontend:
├─ Code splitting per module
├─ Image lazy loading
├─ CSS minification
├─ Tree shaking unused code
├─ Compression (gzip/brotli)
└─ Service Worker (PWA optional)

Backend:
├─ Database indexing (tanggal, crew_id, status)
├─ Query optimization
├─ Connection pooling
├─ Caching common queries (daily_omset_cache)
└─ CDN for static assets
```

---

**Next**: Lihat `6-security.md` untuk keamanan & autentikasi.
