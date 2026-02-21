# Méra OS - Studio Photo Management System

Dokumentasi lengkap desain dan implementasi **Méra OS**, sebuah sistem operasi terintegrasi untuk studio foto modern.

## 📚 Struktur Dokumentasi

```
docs/
├── 1-architecture.md          # Arsitektur sistem & komponen
├── 2-database-schema.md       # Spesifikasi database PostgreSQL/Supabase
├── 3-data-flows.md            # Diagram & alur data per modul
├── 4-ui-ux-wireframes.md      # Wireframe & UI/UX specifications
├── 5-technical-specs.md       # Technology stack & technical details
├── 6-security.md              # Keamanan, PIN, validasi, auth
├── 7-api-endpoints.md         # Semua REST API endpoints
└── 8-deployment.md            # Panduan deployment & environment setup
```

## 🎯 Module Overview

| Modul | Lokasi | Deskripsi |
|-------|--------|-----------|
| **POS** | `pos.jsx` | Point of Sale - transaksi & pembayaran |
| **Absensi** | `absensi.jsx` | Crew attendance - shift & gaji |
| **Photobooth** | `photobooth.jsx` | Photo session capture & editing |
| **Finance** | `finance.jsx` | Dashboard keuangan & laporan |
| **Booking** | `booking.jsx` | Sistem reservasi & monitoring |

## 🚀 Quick Start

```bash
# Setup environment
cp .env.example .env.local

# Install dependencies
npm install

# Run development server
npm run dev

# Build production
npm run build
```

## 📋 Tech Stack

- **Frontend**: React 18+, React Router v6
- **State**: Context API + Custom Hooks
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (untuk foto)
- **Real-time**: Supabase Realtime
- **CSV Parse**: PapaParse
- **Charts**: Recharts
- **Canvas**: HTML5 Canvas API
- **QR**: qrcode.react
- **Printing**: react-thermal-printer
- **UI**: Tailwind CSS + Golden Ratio scaling

## 🔐 Default PINs & Credentials

| Feature | PIN | Catatan |
|---------|-----|--------|
| Dashboard Finance | `////` | 4 garis miring |
| Photobooth Escape | `8080` | Kembali ke crew dashboard |

## 📊 Database Integration

- **Real-time Updates**: Supabase Realtime untuk live sync
- **Photo Storage**: Supabase Storage dengan URL public
- **Backup**: Google Drive integration untuk archival
- **Local Cache**: localStorage untuk offline capability

---

**Lihat file dokumentasi terpisah untuk detail lengkap setiap aspek.**
