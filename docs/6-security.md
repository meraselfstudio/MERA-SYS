# 6. SECURITY & AUTHENTICATION - MÉRA OS

## 6.1 Authentication & Authorization Strategy

### Role-Based Access Control (RBAC)

```
User Roles:
├─ Kasir (Cashier)
│  ├─ Access: POS, Booking check-in, real-time omset
│  ├─ Denied: Finance, Crew data, gaji calculation
│  └─ Permissions: Create transactions, view sales
│
├─ Crew (Staff)
│  ├─ Access: Absensi (check-in/out), own gaji slip
│  ├─ Denied: Finance, other crew data
│  └─ Permissions: Self check-in/out, view own slip
│
├─ Sweeper/Monitor (Supervisor)
│  ├─ Access: Booking schedule monitor, reschedule
│  ├─ Denied: Cash transactions, gaji details
│  └─ Permissions: Cancel/reschedule bookings
│
├─ Owner/Admin (Finance)
│  ├─ Access: All modules (with PIN protection)
│  ├─ Denied: None (full access)
│  └─ Permissions: View reports, manage data
│
└─ Manager
   ├─ Access: Finance, Crew payroll, Bookings
   ├─ Denied: System settings
   └─ Permissions: Reports, payroll verification
```

### PIN-Based Security

```
PIN Types:

1. FINANCE PIN (PIN: ////)
   ├─ Type: 4 characters (digit or symbol)
   ├─ Access: Finance dashboard
   ├─ Session: 1 hour timeout
   ├─ Attempts: 3 tries before lockout
   ├─ Lockout Duration: 5 minutes
   └─ Storage: Hashed in database (bcrypt)

2. CREW PIN (for Absensi)
   ├─ Type: 4 digits
   ├─ Access: Personal check-in (visual selection)
   ├─ Storage: Stored in CSV (plain) - can be upgraded
   ├─ Validation: Local validation (no PIN submission)
   └─ Session: Per attendance record

3. PHOTOBOOTH PIN (PIN: 8080)
   ├─ Type: 4 digits
   ├─ Access: Escape from photobooth to crew dashboard
   ├─ Hardcoded: Can be stored in env variable
   ├─ Validation: Client-side
   └─ Lockout: Yes (3 attempts)
```

### Session Management

```
Session Storage:
├─ Finance Dashboard
│  ├─ Stored in: Context + sessionStorage
│  ├─ Duration: 60 minutes (configurable)
│  ├─ Auto-logout: Yes (warning at 50 min)
│  └─ Re-auth: Requires PIN again
│
└─ Crew Dashboard
   ├─ Stored in: localStorage (persistent)
   ├─ Duration: 12 hours or manual logout
   └─ Validation: Token-based (simple JWT or session)
```

## 6.2 Data Security

### Encryption

```
Data at Rest:
├─ Passwords/PINs: bcrypt (rounds: 12)
├─ Customer data: Encrypted at field level (optional)
├─ Financial records: TLS 1.3 for transport
└─ Photos: AES-256 encryption (Supabase default)

Data in Transit:
├─ HTTPS/TLS 1.3: All API calls
├─ Secure websockets (WSS): Realtime connections
├─ Certificate pinning: Optional for mobile
└─ Request signing: Supabase auth headers
```

### Data Validation & Sanitization

```
Input Validation:
├─ Client-side: Immediate feedback
├─ Server-side: Mandatory validation
│  ├─ Type checking (PostgreSQL constraints)
│  ├─ Range validation (amount > 0)
│  ├─ String length limits
│  ├─ Pattern matching (email, phone)
│  └─ SQL injection prevention (parameterized queries)
│
└─ XSS Prevention:
   ├─ React automatic escaping
   ├─ Content Security Policy (CSP) headers
   └─ Sanitization for user-generated content

OWASP Top 10 Mitigation:
├─ A01: Injection → Parameterized queries, input validation
├─ A02: Broken Auth → PIN validation, session management
├─ A03: Broken Access Control → RLS (Row Level Security)
├─ A04: Insecure Design → Architecture review & testing
├─ A05: Security Misconfiguration → Env variables, secure defaults
├─ A06: Vulnerable Components → Dependency scanning
├─ A07: Auth Failures → MFA option, rate limiting
├─ A08: Data Integrity → Checksums, audit logs
├─ A09: Logging Failures → Comprehensive audit trails
└─ A10: SSRF → URL validation, request filtering
```

## 6.3 Row Level Security (RLS)

### Supabase RLS Policies

```sql
-- Example: Crew bisa lihat attendance mereka sendiri
CREATE POLICY "crew_view_own_attendance"
ON attendance FOR SELECT
USING (
  crew_id = auth.uid()  -- or custom claim via custom JWT
);

-- Kasir bisa see all transactions
CREATE POLICY "kasir_view_transactions"
ON transactions FOR SELECT
USING (
  has_role('kasir') OR has_role('admin')
);

-- Finance dashboard protected by PIN (application-level)
CREATE POLICY "finance_data_protected"
ON daily_omset_cache FOR SELECT
USING (
  current_setting('finance.pin_valid')::boolean = true
);

-- Crew hanya bisa lihat gaji mereka
CREATE POLICY "crew_view_own_payroll"
ON attendance FOR SELECT
USING (
  crew_id = auth.uid()
);

-- Only admin bisa insert expenses
CREATE POLICY "admin_insert_expenses"
ON expenses FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM admin_users)
);
```

## 6.4 API Security

### Request Authentication

```javascript
// Supabase Auth Headers
const headers = {
  'Authorization': `Bearer ${supabase.auth.session().access_token}`,
  'Content-Type': 'application/json',
  'X-Client-Version': '1.0.0',
};

// PIN Validation Middleware (server-side RPC)
const validateFinancePIN = async (pin) => {
  const { data, error } = await supabase
    .rpc('validate_finance_pin', { pin_input: pin })
    .single();

  if (error) return { valid: false, error };
  return { valid: data.is_valid, duration: data.session_duration };
};
```

### Rate Limiting

```
API Rate Limits:
├─ Public endpoints: 60 req/min per IP
├─ Auth endpoints: 10 req/min per IP (PIN validation)
├─ Upload endpoints: 5 req/min per IP (file uploads)
├─ Database queries: 1000 read units/min (Supabase quota)
└─ Realtime subscriptions: 100 concurrent per user

Backoff Strategy:
├─ Linear backoff: 1s, 2s, 3s, 5s
└─ Exponential: 2^n seconds (max 60s)
```

## 6.5 File Security

### Photo Storage & Validation

```javascript
// Upload validation
const validatePhotoUpload = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  if (file.size > maxSize) {
    throw new Error('File size exceeds limit');
  }

  // Verify image by loading
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Upload to Supabase Storage
const uploadPhoto = async (file, path) => {
  const { data, error } = await supabase.storage
    .from('photos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      // Server-side encryption (Supabase default)
    });

  if (error) throw error;
  return data.path;
};

// Generate signed URL (time-limited)
const getPhotoUrl = async (path, expiresIn = 3600) => {
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(path, expiresIn);

  return data.signedUrl;
};
```

### PDF Generation & Storage

```javascript
// Generate Gaji Slip PDF (server-side recommended)
const generateGajiSlipPDF = async (attendanceData) => {
  // Option 1: Server-side generation (Supabase Edge Function)
  const { data, error } = await supabase
    .functions.invoke('generate_slip', { body: attendanceData });

  // Option 2: Client-side with html2pdf
  // (Less secure, PDF contains sensitive data)

  // Upload generated PDF
  const { data: uploaded } = await supabase.storage
    .from('documents')
    .upload(
      `slip_gaji/${attendanceData.crew_id}/${attendanceData.tanggal}.pdf`,
      pdfBlob
    );

  return uploaded.path;
};
```

## 6.6 Audit & Logging

### Comprehensive Audit Trail

```sql
-- Create audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(255),
  operation VARCHAR(50), -- INSERT, UPDATE, DELETE
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  user_name VARCHAR(255),
  ip_address INET,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trigger untuk setiap tabel penting
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, operation, record_id, old_data, new_data, timestamp)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    CURRENT_TIMESTAMP
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply to critical tables
CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_attendance AFTER INSERT OR UPDATE OR DELETE ON attendance
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_expenses AFTER INSERT OR UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

### Access Logging

```javascript
// Log setiap akses ke Finance Dashboard
const logFinanceAccess = async (userId, pinValid) => {
  const { error } = await supabase
    .from('access_logs')
    .insert([{
      module: 'FINANCE',
      user_id: userId,
      pin_valid: pinValid,
      timestamp: new Date(),
      ip_address: getClientIP(),
      user_agent: navigator.userAgent,
    }]);

  if (error) console.error('Audit log failed:', error);
};
```

## 6.7 Network & Infrastructure Security

### CORS Configuration

```javascript
// Only allow specific origins
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.VITE_APP_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
```

### CSP Headers (Content Security Policy)

```
Content-Security-Policy:
├─ default-src 'self'
├─ script-src 'self' 'unsafe-inline' (for canvas)
├─ style-src 'self' 'unsafe-inline' (for Tailwind)
├─ img-src 'self' data: https: (for photos)
├─ connect-src 'self' https://*.supabase.co wss://*.supabase.co
├─ media-src 'self' blob: (for webcam)
└─ frame-ancestors 'none'
```

### HTTPS Enforcement

```javascript
// Vercel deployment enforces HTTPS automatically
// Local development: Use self-signed cert or ngrok

// Check HTTPS in app
if (window.location.protocol !== 'https:' && !isDevelopment) {
  window.location.replace('https:' + window.location.href.substring(window.location.protocol.length));
}
```

## 6.8 Third-Party Security

### Dependency Management

```bash
# Regular updates
npm audit
npm update

# Security scanning
npm run lint
npm run type-check

# Check for vulnerabilities
npm install -g snyk
snyk test

# Lock dependencies
npm ci (use package-lock.json)
```

### Google Drive API Security

```javascript
// Secure backup to Google Drive
const backupToGoogleDrive = async (data, fileName) => {
  // Use service account (not user credentials)
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = google.drive({ version: 'v3', auth });

  // Upload with encryption
  const fileMetadata = {
    name: fileName,
    parents: [process.env.VITE_GOOGLE_DRIVE_FOLDER_ID],
    mimeType: 'application/json',
  };

  const media = {
    mimeType: 'application/json',
    body: JSON.stringify(data), // Can be encrypted
  };

  return drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id, webViewLink',
  });
};
```

## 6.9 Incident Response Plan

### Security Incident Checklist

```
1. Identification
   □ Detect unauthorized access
   □ Monitor audit logs for anomalies
   □ Set up alerts on Sentry/LogDNA

2. Containment
   □ Revoke compromised tokens
   □ Change vulnerable APIKeys
   □ Isolate affected systems

3. Investigation
   □ Review audit logs
   □ Check for data exfiltration
   □ Analyze attack vectors

4. Recovery
   □ Restore from backups
   □ Patch vulnerabilities
   □ Verify integrity

5. Post-Incident
   □ Document lessons learned
   □ Update security policies
   □ Notify affected users
   □ Report to relevant authorities
```

## 6.10 Security Checklist

```
Before Production Deployment:

□ Environment Variables
  □ All secrets in .env (not in code)
  □ Database credentials encrypted
  □ API keys rotated

□ Authentication
  □ PIN hashing implemented (bcrypt)
  □ Session timeout configured
  □ Rate limiting enabled

□ Authorization
  □ RLS policies in place
  □ Role-based access control tested
  □ Admin functions protected

□ Data Protection
  □ HTTPS enforced
  □ CORS properly configured
  □ CSP headers set

□ Input Validation
  □ Client-side validation working
  □ Server-side validation present
  □ File upload validation

□ Logging & Monitoring
  □ Audit logs enabled
  □ Error tracking (Sentry) configured
  □ Log aggregation (LogDNA) setup

□ Code Quality
  □ No hardcoded secrets
  □ No console.log with sensitive data
  □ Dependencies scanned for vulnerabilities

□ Testing
  □ Security test cases written
  □ Penetration testing done
  □ Load testing completed

□ Deployment
  □ Staging environment mirrors production
  □ Backup strategy tested
  □ Disaster recovery plan documented
```

---

**Next**: Lihat `7-api-endpoints.md` untuk dokumentasi lengkap API dan `8-deployment.md` untuk deployment guide.
