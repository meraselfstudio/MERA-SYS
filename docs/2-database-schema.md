# 2. DATABASE SCHEMA - MÉRA OS

## 2.1 Overview Database

**Platform**: Supabase (PostgreSQL)
**Real-time**: ✓ Enabled pada semua tabel
**Storage**: Supabase Storage Bucket untuk foto, slip, laporan

## 2.2 Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│    customers    │
├─────────────────┤
│ id (PK)         │
│ nama            │
│ email           │
│ phone           │
│ instagram       │
│ created_at      │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼──────────────┐
│   transactions (POS)   │
├───────────────────────┤
│ id (PK)               │
│ customer_id (FK)      │
│ tanggal               │
│ jam                   │
│ tipe (BOOKING/OTS)    │
│ payment_method        │
│ total_amount          │
│ items_json            │
│ kasir_id              │
│ created_at            │
└───────────────────────┘

┌─────────────────┐         ┌──────────────────┐
│   products      │         │      crew        │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │         │ id (PK)          │
│ nama            │         │ nama             │
│ kategori        │         │ posisi           │
│ tipe_harga      │         │ pin              │
│ harga           │         │ status_gaji      │
│ tier_1,2,3      │         │ created_at       │
└─────────────────┘         └────────┬─────────┘
                                     │
                            ┌────────▼──────────────┐
                            │    attendance        │
                            ├───────────────────────┤
                            │ id (PK)               │
                            │ crew_id (FK)         │
                            │ tanggal               │
                            │ jam_masuk             │
                            │ jam_keluar            │
                            │ foto_in_url           │
                            │ foto_out_url          │
                            │ shift_type            │
                            │ gaji_pokok            │
                            │ potongan_keterlambatan│
                            │ bonus_tim             │
                            │ gaji_bersih           │
                            │ created_at            │
                            └───────────────────────┘

┌──────────────────┐
│    bookings      │
├──────────────────┤
│ id (PK)          │
│ customer_id (FK) │
│ package_id       │
│ tanggal_booking  │
│ jam_booking      │
│ status           │
│ qr_code          │
│ payment_status   │
│ created_at       │
└──────────────────┘

┌──────────────────┐
│ photobooth       │
├──────────────────┤
│ id (PK)          │
│ session_id       │
│ photos_json[]    │
│ drawing_data     │
│ stickers_json[]  │
│ final_output_url │
│ created_at       │
└──────────────────┘

┌──────────────────┐
│   expenses       │
├──────────────────┤
│ id (PK)          │
│ kategori         │
│ deskripsi        │
│ metode           │
│ nominal          │
│ tanggal          │
│ created_at       │
└──────────────────┘
```

## 2.3 Tabel Detail & SQL Schema

### Tabel: `customers`

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  instagram VARCHAR(255),
  profil_foto_url TEXT,
  tipe_customer VARCHAR(50), -- 'BOOKING' / 'OTS'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk pencarian cepat
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
```

### Tabel: `products`

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  kategori VARCHAR(100) NOT NULL, -- 'Basic Studio' / 'Thematic Studio' / 'Add Ons'
  tipe_harga VARCHAR(50) NOT NULL, -- 'normal' / 'bertingkat'
  harga_normal INTEGER, -- Untuk tipe_harga = 'normal'
  tier_1 INTEGER, -- Untuk tipe_harga = 'bertingkat'
  tier_2 INTEGER,
  tier_3 INTEGER,
  tier_lebih INTEGER,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index kategori untuk filter cepat
CREATE INDEX idx_products_kategori ON products(kategori);
```

### Tabel: `transactions` (POS)

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  tanggal DATE DEFAULT CURRENT_DATE,
  jam TIME DEFAULT CURRENT_TIME,
  tipe VARCHAR(50), -- 'BOOKING' / 'OTS'
  payment_method VARCHAR(50), -- 'QRIS' / 'CASH'
  total_amount INTEGER NOT NULL,

  -- JSON untuk item details
  items_json JSONB NOT NULL, -- [{id, nama, kategori, qty, harga, subtotal}]

  -- Kasir info
  kasir_id UUID,
  kasir_nama VARCHAR(255),

  -- Receipt
  receipt_number VARCHAR(50) UNIQUE,
  receipt_printed BOOLEAN DEFAULT false,

  -- Real-time sync ke Finance
  synced_to_finance BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Trigger untuk omset harian
  CONSTRAINT chk_total_amount CHECK (total_amount > 0)
);

-- Index untuk query cepat
CREATE INDEX idx_transactions_tanggal ON transactions(tanggal);
CREATE INDEX idx_transactions_tipe ON transactions(tipe);
CREATE INDEX idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
```

### Tabel: `crew`

```sql
CREATE TABLE crew (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(255) NOT NULL,
  posisi VARCHAR(50), -- 'Crew' / 'Intern'
  pin VARCHAR(50) NOT NULL, -- PIN untuk absensi
  status_gaji VARCHAR(50), -- 'PRO' / 'INTERN'
  gaji_per_shift INTEGER,

  -- For PRO crew, gaji variation by shift type
  gaji_weekday_fulltime INTEGER, -- 75000
  gaji_weekend_shift1 INTEGER, -- 35000
  gaji_weekend_shift2 INTEGER, -- 35000
  gaji_weekend_fulltime INTEGER, -- 100000

  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk PIN lookup
CREATE INDEX idx_crew_pin ON crew(pin);
```

### Tabel: `attendance`

```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES crew(id),
  tanggal DATE NOT NULL,

  -- IN
  jam_masuk TIME,
  foto_in_url TEXT, -- URL ke Supabase Storage

  -- OUT
  jam_keluar TIME,
  foto_out_url TEXT,

  -- Shift Info
  shift_type VARCHAR(50), -- Weekday Full Time, Weekend Shift 1, etc
  shift_start_time TIME,
  shift_end_time TIME,

  -- Gaji Calculation
  gaji_pokok INTEGER,
  potongan_keterlambatan INTEGER DEFAULT 0, -- -5000 per 10 menit setelah menit ke-11
  bonus_tim INTEGER DEFAULT 0, -- Dari omset harian
  gaji_bersih INTEGER,

  -- Omset Verification
  omset_cash INTEGER,
  omset_qris INTEGER,
  omset_total INTEGER,
  omset_verified BOOLEAN DEFAULT false,

  -- Slip
  slip_gaji_url TEXT, -- Generated PDF

  -- Status
  has_photo_in BOOLEAN DEFAULT false,
  has_photo_out BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING' / 'VERIFIED' / 'FINALIZED'

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(crew_id, tanggal)
);

-- Index untuk query harian
CREATE INDEX idx_attendance_tanggal ON attendance(tanggal);
CREATE INDEX idx_attendance_crew_id ON attendance(crew_id);
CREATE INDEX idx_attendance_status ON attendance(status);
```

### Tabel: `bookings`

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),

  -- Package Info
  package_id INTEGER REFERENCES products(id),
  package_name VARCHAR(255),
  package_price INTEGER,

  -- DateTime
  tanggal_booking DATE NOT NULL,
  jam_booking TIME NOT NULL,
  durasi_menit INTEGER DEFAULT 60,

  -- Status
  status VARCHAR(50) NOT NULL, -- 'KEEPSLOT' / 'PAID' / 'ARRIVED' / 'PAID_AND_IN_STUDIO' / 'COMPLETED' / 'CANCELLED'

  -- Payment
  payment_method VARCHAR(50), -- 'QRIS' / 'CASH'
  payment_status VARCHAR(50), -- 'PENDING' / 'PAID'

  -- QR Code
  qr_code_data TEXT, -- JSON encoded untuk verifikasi
  qr_code_url TEXT, -- URL gambar QR

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- KEEPSLOT expires in 6 hours
  check_in_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,

  created_by_admin BOOLEAN DEFAULT false -- true jika dibuat admin, false jika customer
);

-- Index untuk query status
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_tanggal ON bookings(tanggal_booking);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_expires_at ON bookings(expires_at);
```

### Tabel: `photobooth_sessions`

```sql
CREATE TABLE photobooth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key VARCHAR(50) UNIQUE,

  -- Photos (array of URLs)
  photo_1_url TEXT,
  photo_2_url TEXT,
  photo_3_url TEXT,
  photo_4_url TEXT,
  photo_5_url TEXT,
  photo_6_url TEXT,

  -- Processing
  mirroring_enabled BOOLEAN DEFAULT false,

  -- Editing
  canvas_drawing_url TEXT, -- Drawing data (base64 or canvas snapshot)
  stickers_json JSONB, -- [{id, x, y, width, height, src}]

  -- Final Output
  strip_4r_url TEXT, -- Final 1200x1800 image with logo
  final_output_url TEXT, -- Downloaded as JPEG

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Index session lookup
CREATE INDEX idx_photobooth_session_key ON photobooth_sessions(session_key);
```

### Tabel: `expenses`

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kategori VARCHAR(100) NOT NULL, -- 'Supplies', 'Maintenance', 'Utilities', etc
  deskripsi TEXT,
  metode VARCHAR(50), -- 'CASH' / 'BANK_TRANSFER' / etc
  nominal INTEGER NOT NULL,
  tanggal DATE DEFAULT CURRENT_DATE,
  bukti_url TEXT, -- URL receipt/bukti
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_nominal CHECK (nominal > 0)
);

-- Index untuk reporting
CREATE INDEX idx_expenses_tanggal ON expenses(tanggal);
CREATE INDEX idx_expenses_kategori ON expenses(kategori);
```

### Tabel: `daily_omset_cache` (untuk performa)

```sql
CREATE TABLE daily_omset_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE UNIQUE NOT NULL,
  omset_cash INTEGER DEFAULT 0,
  omset_qris INTEGER DEFAULT 0,
  omset_total INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  ots_count INTEGER DEFAULT 0,
  bonus_tim INTEGER DEFAULT 0,
  total_expenses INTEGER DEFAULT 0,
  net_profit INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX idx_omset_cache_tanggal ON daily_omset_cache(tanggal);
```

## 2.4 Triggers & Functions

### Function: Calculate Daily Omset (untuk cache)

```sql
CREATE OR REPLACE FUNCTION update_daily_omset(p_tanggal DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO daily_omset_cache (tanggal, omset_cash, omset_qris, omset_total, booking_count, ots_count)
  SELECT
    p_tanggal,
    COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN total_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment_method = 'QRIS' THEN total_amount ELSE 0 END), 0),
    COALESCE(SUM(total_amount), 0),
    COALESCE(SUM(CASE WHEN tipe = 'BOOKING' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tipe = 'OTS' THEN 1 ELSE 0 END), 0)
  FROM transactions
  WHERE tanggal = p_tanggal
  ON CONFLICT (tanggal) DO UPDATE SET
    omset_cash = EXCLUDED.omset_cash,
    omset_qris = EXCLUDED.omset_qris,
    omset_total = EXCLUDED.omset_total,
    booking_count = EXCLUDED.booking_count,
    ots_count = EXCLUDED.ots_count,
    last_updated = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Trigger saat ada transaksi baru
CREATE TRIGGER trg_update_omset_on_transaction
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_daily_omset(CURRENT_DATE);
```

### Function: Calculate Gaji Bersih (saat crew OUT)

```sql
CREATE OR REPLACE FUNCTION calculate_gaji_bersih(p_attendance_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_gaji_pokok INTEGER;
  v_potongan INTEGER := 0;
  v_bonus INTEGER := 0;
  v_jam_masuk TIME;
  v_jam_keluar TIME;
  v_shift_start_time TIME;
  v_jam_terlambat_menit INTEGER := 0;
  v_omset_total INTEGER;
  v_bonus_target_weekday INTEGER := 1000000;
  v_bonus_target_weekend INTEGER := 1500000;
BEGIN
  -- Get attendance data
  SELECT jam_masuk, jam_keluar, gaji_pokok, shift_start_time, omset_total
  INTO v_jam_masuk, v_jam_keluar, v_gaji_pokok, v_shift_start_time, v_omset_total
  FROM attendance
  WHERE id = p_attendance_id;

  -- Hitung keterlambatan (dimulai dari menit ke-11 setelah shift start)
  v_jam_terlambat_menit := EXTRACT(MINUTE FROM (v_jam_masuk - v_shift_start_time));
  IF v_jam_terlambat_menit > 10 THEN
    v_potongan := ((v_jam_terlambat_menit - 10) / 10) * 5000;
  END IF;

  -- Hitung bonus tim berdasarkan omset
  IF v_omset_total > v_bonus_target_weekday THEN
    v_bonus := 20000 + ((v_omset_total - v_bonus_target_weekday) / 50000) * 5000;
  END IF;

  RETURN v_gaji_pokok - v_potongan + v_bonus;
END;
$$ LANGUAGE plpgsql;
```

### Function: Auto-expire KEEPSLOT Bookings

```sql
CREATE OR REPLACE FUNCTION auto_expire_keepslot_bookings()
RETURNS void AS $$
BEGIN
  UPDATE bookings
  SET status = 'CANCELLED',
      cancelled_at = CURRENT_TIMESTAMP
  WHERE status = 'KEEPSLOT'
    AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Run every 5 minutes (setup as scheduled job or trigger)
CREATE OR REPLACE FUNCTION schedule_expire_bookings()
RETURNS void AS $$
BEGIN
  -- This will be called via database cron or application scheduler
  PERFORM auto_expire_keepslot_bookings();
END;
$$ LANGUAGE plpgsql;
```

## 2.5 Real-time Subscriptions

### Enable Real-time untuk tabel-tabel penting

```sql
-- Di Supabase Dashboard, enable Realtime untuk:
-- - transactions (untuk live omset update ke Finance)
-- - attendance (untuk live gaji display)
-- - bookings (untuk live schedule monitor)
-- - daily_omset_cache (untuk live dashboard)
-- - expenses (untuk live profit calculation)
```

Dalam React, subscribe:

```javascript
// Contoh dalam Context
const subscribeToTransactions = () => {
  supabase
    .from('transactions')
    .on('*', (payload) => {
      console.log('New transaction:', payload);
      updateOmset(); // Update cash, QRIS, total
    })
    .subscribe();
};
```

## 2.6 Storage Buckets

### Bucket: `photos`
```
mera-os-photos/
├── attendance/
│   ├── crew_{crew_id}/
│   │   ├── {tanggal}_{jam_masuk}.jpg (foto in)
│   │   └── {tanggal}_{jam_keluar}.jpg (foto out)
├── photobooth/
│   ├── {session_id}/
│   │   ├── raw_1.jpg ... raw_6.jpg
│   │   ├── canvas_drawing.png
│   │   └── final_output.jpg
└── transactions/
    └── {receipt_number}.pdf (thermal receipt)
```

### Bucket: `documents`
```
mera-os-docs/
├── slip_gaji/
│   ├── {crew_id}/{tanggal}.pdf
├── monthly_reports/
│   ├── {bulan_tahun}_laporan.pdf
└── backups/
    └── {tanggal_backup}.json
```

## 2.7 Row Level Security (RLS) Policies

```sql
-- Contoh RLS untuk attendance
CREATE POLICY "Crew bisa lihat attendance mereka sendiri"
ON attendance FOR SELECT
USING (crew_id = (SELECT id FROM crew WHERE pin = current_setting('app.pin')));

-- Kasir bisa see all transactions
CREATE POLICY "Kasir bisa see all transactions"
ON transactions FOR SELECT
USING (auth.role() = 'authenticated');

-- Finance hanya bisa see dengan PIN
CREATE POLICY "Finance PIN protected"
ON daily_omset_cache FOR SELECT
USING (current_setting('finance.pin_valid') = 'true');
```

---

**Next**: Lihat `3-data-flows.md` untuk diagram alur data detail per modul.
