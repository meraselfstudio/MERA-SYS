# 7. API ENDPOINTS & SUPABASE RPC FUNCTIONS - MÉRA OS

## 7.1 Transaction Management APIs

### POST /api/transactions - Create Transaction (POS)

```http
POST /api/transactions
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "customer_id": "uuid",
  "customer_name": "John Doe",
  "customer_instagram": "@johndoe",
  "customer_phone": "+628xxx",
  "tanggal": "2025-02-17",
  "jam": "14:30:45",
  "tipe": "BOOKING" | "OTS",
  "payment_method": "CASH" | "QRIS",
  "total_amount": 125000,
  "items_json": [
    {
      "id": 1,
      "nama": "Self Photo Session",
      "kategori": "Basic Studio",
      "qty": 1,
      "harga": 50000,
      "subtotal": 50000
    },
    {
      "id": 9,
      "nama": "Add Print",
      "kategori": "Add Ons",
      "tipe_harga": "bertingkat",
      "qty": 2,
      "harga": 30000,
      "subtotal": 60000,
      "tier_used": "tier_2"
    }
  ],
  "kasir_id": "uuid",
  "kasir_nama": "Staff Name"
}

Response 201:
{
  "id": "uuid",
  "receipt_number": "RCP-20250217-001",
  "created_at": "2025-02-17T14:30:45Z",
  "status": "success"
}

Response 400:
{
  "error": "Invalid transaction data",
  "details": "Total amount must be greater than 0"
}
```

### GET /api/transactions - Get Transactions

```http
GET /api/transactions?tanggal=2025-02-17&tipe=BOOKING&payment_method=QRIS
Authorization: Bearer TOKEN

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "customer_name": "John Doe",
      "tanggal": "2025-02-17",
      "jam": "14:30:45",
      "tipe": "BOOKING",
      "payment_method": "QRIS",
      "total_amount": 125000,
      "items_json": [...],
      "receipt_number": "RCP-20250217-001"
    }
  ],
  "count": 15,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_pages": 1
  }
}
```

### GET /api/transactions/:id - Get Single Transaction

```http
GET /api/transactions/uuid
Authorization: Bearer TOKEN

Response 200:
{
  "id": "uuid",
  "customer_name": "John Doe",
  "customer_instagram": "@johndoe",
  "tanggal": "2025-02-17",
  "jam": "14:30:45",
  "tipe": "BOOKING",
  "payment_method": "QRIS",
  "total_amount": 125000,
  "items_json": [...],
  "receipt_printed": true,
  "kasir_nama": "Staff Name",
  "created_at": "2025-02-17T14:30:45Z"
}
```

## 7.2 Attendance Management APIs

### POST /api/attendance/in - Check In

```http
POST /api/attendance/in
Authorization: Bearer TOKEN
Content-Type: multipart/form-data

FormData:
├─ crew_id: "uuid"
├─ crew_name: "Satria"
├─ tanggal: "2025-02-17"
├─ jam_masuk: "14:30:47"
├─ shift_type: "Weekday Full Time"
├─ shift_start_time: "12:00:00"
├─ shift_end_time: "21:00:00"
├─ gaji_pokok: 75000
├─ foto_in: [FILE JPEG]
└─ mirroring_enabled: false

Response 201:
{
  "id": "uuid",
  "crew_id": "uuid",
  "crew_name": "Satria",
  "status": "IN",
  "jam_masuk": "2025-02-17T14:30:47Z",
  "foto_in_url": "https://storage.supabase.co/...",
  "gaji_pokok": 75000
}
```

### PUT /api/attendance/:id/out - Check Out (with auto calculation)

```http
PUT /api/attendance/uuid/out
Authorization: Bearer TOKEN
Content-Type: multipart/form-data

FormData:
├─ jam_keluar: "21:05:12"
├─ omset_cash: 485000
├─ omset_qris: 315000
├─ omset_total: 800000
├─ foto_out: [FILE JPEG]
└─ omset_verified: true

Response 200:
{
  "id": "uuid",
  "status": "OUT",
  "jam_keluar": "2025-02-17T21:05:12Z",
  "gaji_pokok": 75000,
  "potongan_keterlambatan": -5000,
  "bonus_tim": 20000,
  "gaji_bersih": 90000,
  "slip_gaji_url": "https://storage.supabase.co/...",
  "calculatedAt": "2025-02-17T21:05:15Z"
}
```

### GET /api/attendance - Get Attendance Records

```http
GET /api/attendance?tanggal=2025-02-17&crew_id=all&status=OUT
Authorization: Bearer TOKEN

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "crew_id": "uuid",
      "crew_name": "Satria",
      "tanggal": "2025-02-17",
      "jam_masuk": "14:30:47",
      "jam_keluar": "21:05:12",
      "shift_type": "Weekday Full Time",
      "status": "FINALIZED",
      "gaji_pokok": 75000,
      "potongan_keterlambatan": -5000,
      "bonus_tim": 20000,
      "gaji_bersih": 90000,
      "foto_in_url": "...",
      "foto_out_url": "...",
      "slip_gaji_url": "..."
    }
  ]
}
```

## 7.3 Photobooth APIs

### POST /api/photobooth/session - Create Session

```http
POST /api/photobooth/session
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "session_key": "uuid" | auto-generated,
  "mirroring_enabled": false
}

Response 201:
{
  "id": "uuid",
  "session_key": "uuid",
  "created_at": "2025-02-17T14:30:45Z"
}
```

### POST /api/photobooth/upload - Upload Photo

```http
POST /api/photobooth/session/uuid/upload
Authorization: Bearer TOKEN
Content-Type: multipart/form-data

FormData:
├─ photo_number: 1
└─ file: [JPEG IMAGE]

Response 201:
{
  "photo_number": 1,
  "url": "https://storage.supabase.co/...",
  "size": 450000,
  "uploaded_at": "2025-02-17T14:30:50Z"
}
```

### PUT /api/photobooth/:id/finalize - Finalize & Save Output

```http
PUT /api/photobooth/uuid/finalize
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "canvas_drawing_data": "base64-encoded-image",
  "stickers": [
    {
      "id": "sticker-1",
      "src": "data:image/png;base64,...",
      "x": 100,
      "y": 200,
      "width": 150,
      "height": 150
    }
  ],
  "strip_4r_url": "data:image/jpeg;base64,...",
  "final_output_url": "data:image/jpeg;base64,..."
}

Response 200:
{
  "id": "uuid",
  "session_key": "uuid",
  "final_output_url": "https://storage.supabase.co/...",
  "strip_4r_url": "https://storage.supabase.co/...",
  "completed_at": "2025-02-17T14:35:30Z",
  "download_url": "..."
}
```

## 7.4 Booking Management APIs

### POST /api/bookings - Create Booking

```http
POST /api/bookings
Content-Type: application/json

{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+628xxx",
  "customer_instagram": "@johndoe",
  "package_id": 1,
  "tanggal_booking": "2025-02-20",
  "jam_booking": "14:00:00",
  "durasi_menit": 60,
  "payment_option": "FULL_PAYMENT" | "KEEP_SLOT",
  "payment_method": "QRIS" | "CASH"
}

Response 201:
{
  "id": "uuid",
  "booking_number": "BK-20250217-001",
  "qr_code_url": "https://storage.supabase.co/...",
  "status": "PAID" | "KEEPSLOT",
  "expires_at": "2025-02-17T20:30:45Z" (if KEEPSLOT),
  "total_amount": 135000,
  "created_at": "2025-02-17T14:30:45Z"
}
```

### PUT /api/bookings/:id - Update Booking Status

```http
PUT /api/bookings/uuid
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "status": "ARRIVED" | "PAID_AND_IN_STUDIO" | "COMPLETED" | "CANCELLED",
  "check_in_at": "2025-02-20T13:55:00Z",
  "completed_at": "2025-02-20T15:00:00Z"
}

Response 200:
{
  "id": "uuid",
  "status": "PAID_AND_IN_STUDIO",
  "updated_at": "2025-02-20T13:55:01Z"
}
```

### GET /api/bookings - Get All Bookings

```http
GET /api/bookings?status=KEEPSLOT&tanggal_booking=2025-02-20&sort=expires_at
Authorization: Bearer TOKEN

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "booking_number": "BK-20250217-001",
      "customer_name": "John Doe",
      "tanggal_booking": "2025-02-20",
      "jam_booking": "14:00:00",
      "package_name": "Party Photo Session",
      "status": "KEEPSLOT",
      "expires_at": "2025-02-17T20:30:45Z",
      "time_remaining": "3h 25m"
    }
  ],
  "total": 4
}
```

### GET /api/bookings/:id/qr - Get QR Code

```http
GET /api/bookings/uuid/qr
Authorization: Bearer TOKEN

Response 200:
{
  "qr_code_url": "https://storage.supabase.co/...",
  "qr_data": {
    "booking_id": "uuid",
    "booking_number": "BK-20250217-001",
    "customer_name": "John Doe",
    "timestamp": "2025-02-17T14:30:45Z"
  }
}
```

## 7.5 Finance APIs

### GET /api/finance/summary - Dashboard Summary

```http
GET /api/finance/summary?tanggal=2025-02-17
Authorization: Bearer TOKEN
PIN: verified (context check)

Response 200:
{
  "omset": {
    "cash": 1200000,
    "qris": 900000,
    "total": 2100000
  },
  "expenses": {
    "total": 300000,
    "by_category": {
      "Supplies": 75000,
      "Maintenance": 150000,
      "Utilities": 75000
    }
  },
  "profit": 1800000,
  "traffic": {
    "booking_count": 8,
    "ots_count": 12,
    "total": 20
  },
  "payroll": {
    "total_paid": 450000,
    "crew_count": 3
  }
}
```

### GET /api/finance/payroll - Crew Payroll Details

```http
GET /api/finance/payroll?tanggal=2025-02-17
Authorization: Bearer TOKEN

Response 200:
{
  "data": [
    {
      "crew_id": "uuid",
      "crew_name": "Satria",
      "position": "Crew",
      "salary_type": "PRO",
      "shift_type": "Weekday Full Time",
      "gaji_pokok": 75000,
      "potongan_keterlambatan": -5000,
      "bonus_tim": 20000,
      "gaji_bersih": 90000,
      "slip_gaji_url": "https://storage.supabase.co/...",
      "status": "FINALIZED"
    }
  ],
  "summary": {
    "total_payroll": 450000,
    "total_bonus_pool": 60000,
    "crew_present": 3
  }
}
```

### POST /api/finance/expenses - Add Expense

```http
POST /api/finance/expenses
Authorization: Bearer TOKEN
Content-Type: multipart/form-data

FormData:
├─ kategori: "Supplies"
├─ deskripsi: "Paper dan Ink cartridge"
├─ metode: "CASH"
├─ nominal: 75000
├─ tanggal: "2025-02-17"
├─ bukti: [FILE PDF/IMAGE]
└─ notes: ""

Response 201:
{
  "id": "uuid",
  "kategori": "Supplies",
  "nominal": 75000,
  "tanggal": "2025-02-17",
  "bukti_url": "https://storage.supabase.co/...",
  "created_at": "2025-02-17T14:30:45Z"
}
```

### GET /api/finance/reports - Generate Reports

```http
GET /api/finance/reports?type=MONTHLY&month=2025-02
Authorization: Bearer TOKEN

Response 200:
{
  "report_url": "https://storage.supabase.co/monthly_reports/2025-02.pdf",
  "report_data": {
    "period": "February 2025",
    "total_revenue": 52500000,
    "total_expenses": 9000000,
    "net_profit": 43500000,
    "transactions": 450,
    "crew_payroll": 1350000,
    "average_daily_omset": 1750000
  }
}
```

## 7.6 Product Management APIs

### GET /api/products - Get Products

```http
GET /api/products?kategori=Basic%20Studio
Authorization: Bearer TOKEN

Response 200:
{
  "data": [
    {
      "id": 1,
      "nama": "Self Photo Session",
      "kategori": "Basic Studio",
      "tipe_harga": "normal",
      "harga": 50000
    },
    {
      "id": 2,
      "nama": "Party Photo Session",
      "kategori": "Basic Studio",
      "tipe_harga": "normal",
      "harga": 135000
    },
    {
      "id": 9,
      "nama": "Add Print",
      "kategori": "Add Ons",
      "tipe_harga": "bertingkat",
      "tier_1": 15000,
      "tier_2": 30000,
      "tier_3": 35000,
      "tier_lebih": 13000
    }
  ]
}
```

## 7.7 Crew Management APIs

### GET /api/crew - Get Crew List

```http
GET /api/crew
Authorization: Bearer TOKEN

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "nama": "Satria",
      "posisi": "Crew",
      "pin": "5050",
      "status_gaji": "PRO",
      "aktif": true
    },
    {
      "id": "uuid",
      "nama": "Ena",
      "posisi": "Intern",
      "pin": "1324",
      "status_gaji": "INTERN",
      "aktif": true
    }
  ]
}
```

## 7.8 Supabase RPC Functions (Server-side Logic)

### RPC: validate_finance_pin

```sql
-- Function definition
CREATE OR REPLACE FUNCTION validate_finance_pin(pin_input TEXT)
RETURNS TABLE(is_valid BOOLEAN, session_duration INTEGER) AS $$
DECLARE
  v_pin_hash TEXT;
  v_stored_hash TEXT;
BEGIN
  -- Hash input PIN
  v_pin_hash := crypt(pin_input, gen_salt('bf'));

  -- Check against stored PIN (hardcoded for MVP, later in DB)
  v_stored_hash := crypt('////', gen_salt('bf'));

  is_valid := (pin_input = '////');  -- Hardcoded for MVP
  session_duration := 3600;  -- 1 hour

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage in frontend
const validatePIN = async (pin) => {
  const { data, error } = await supabase
    .rpc('validate_finance_pin', { pin_input: pin })
    .single();

  return data?.is_valid || false;
};
```

### RPC: calculate_daily_omset

```sql
CREATE OR REPLACE FUNCTION calculate_daily_omset(p_tanggal DATE)
RETURNS TABLE(
  total_omset INTEGER,
  cash_total INTEGER,
  qris_total INTEGER,
  transaction_count INTEGER,
  is_target_met BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(total_amount)::INTEGER,
    SUM(CASE WHEN payment_method = 'CASH' THEN total_amount ELSE 0 END)::INTEGER,
    SUM(CASE WHEN payment_method = 'QRIS' THEN total_amount ELSE 0 END)::INTEGER,
    COUNT(*)::INTEGER,
    SUM(total_amount) >= 1000000::BOOLEAN
  FROM transactions
  WHERE DATE(created_at) = p_tanggal;
END;
$$ LANGUAGE plpgsql;
```

### RPC: get_crew_exists_today

```sql
CREATE OR REPLACE FUNCTION get_crew_exists_today(p_tanggal DATE)
RETURNS TABLE(crew_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(DISTINCT crew_id)::INTEGER
  FROM attendance
  WHERE tanggal = p_tanggal
    AND jam_keluar IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
```

### RPC: auto_expire_bookings

```sql
CREATE OR REPLACE FUNCTION auto_expire_bookings()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE bookings
  SET status = 'CANCELLED',
      cancelled_at = CURRENT_TIMESTAMP
  WHERE status = 'KEEPSLOT'
    AND expires_at < CURRENT_TIMESTAMP
  RETURNING id;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;
```

## 7.9 WebSocket Realtime Subscriptions

### Subscribe to Transactions (Real-time omset update)

```javascript
const subscribeToTransactions = (callback) => {
  const subscription = supabase
    .from('transactions')
    .on('INSERT', (payload) => {
      console.log('New transaction:', payload.new);
      callback(payload.new);
    })
    .on('UPDATE', (payload) => {
      console.log('Transaction updated:', payload.new);
      callback(payload.new);
    })
    .subscribe();

  return subscription;
};

// Usage in Finance Dashboard
useEffect(() => {
  const sub = subscribeToTransactions((transaction) => {
    updateOmsetSummary();
    updateDashboard();
  });

  return () => sub.unsubscribe();
}, []);
```

### Subscribe to Bookings (Schedule Monitor)

```javascript
const subscribeToBookings = (callback) => {
  return supabase
    .from('bookings')
    .on('*', (payload) => {
      if (payload.new.status === 'KEEPSLOT') {
        callback(payload.new);
      }
    })
    .subscribe();
};
```

---

**Next**: Lihat `8-deployment.md` untuk panduan deployment dan setup.
