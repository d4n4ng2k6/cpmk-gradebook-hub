# Nilai OBE — Sistem Penilaian Berbasis Capaian (CPL / CPMK / Sub-CPMK)

Aplikasi web untuk mengelola penilaian mata kuliah berbasis **Outcome-Based Education (OBE)**. Dosen melakukan penilaian per **Sub-CPMK**, sistem mengagregasi nilai ke level **CPMK** dan **CPL** untuk setiap mahasiswa, lengkap dengan **laporan** dan **grafik radar (spider)** capaian per mahasiswa.

- **Frontend**: React 18 + Vite 5 + TypeScript + Tailwind CSS + shadcn/ui + Recharts
- **Backend**: Lovable Cloud (PostgreSQL + Auth + Edge Functions, berbasis Supabase)
- **Routing**: React Router (SPA, `BrowserRouter`)
- **State**: TanStack Query, Context API untuk Auth

---

## Daftar Isi

1. [Fitur Utama](#fitur-utama)
2. [Arsitektur](#arsitektur)
3. [Model Data](#model-data)
4. [Peran Pengguna](#peran-pengguna)
5. [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
6. [Konfigurasi Environment](#konfigurasi-environment)
7. [Struktur Proyek](#struktur-proyek)
8. [Alur Penggunaan](#alur-penggunaan)
9. [Akun Admin Default](#akun-admin-default)
10. [Backend (Lovable Cloud)](#backend-lovable-cloud)
11. [Deploy Frontend](#deploy-frontend)
    - [Opsi 1: Publish via Lovable](#opsi-1-publish-via-lovable)
    - [Opsi 2: Server Terpisah (Vercel / Netlify / Cloudflare Pages)](#opsi-2-server-terpisah-vercel--netlify--cloudflare-pages)
    - [Opsi 3: VPS dengan Nginx](#opsi-3-vps-dengan-nginx)
    - [Opsi 4: Docker](#opsi-4-docker)
    - [Opsi 5: Static Hosting (S3 / GitHub Pages)](#opsi-5-static-hosting-s3--github-pages)
12. [Testing](#testing)
13. [Troubleshooting](#troubleshooting)

---

## Fitur Utama

- 🔐 **Autentikasi** email/password (Sign Up & Sign In) + role-based access (admin/dosen).
- 📊 **Dashboard** ringkasan mata kuliah & mahasiswa.
- 📥 **Upload Excel** akademik untuk membuat mata kuliah & enrollment otomatis.
- 🎯 **Penilaian Sub-CPMK** per mahasiswa per mata kuliah.
- 🧮 **Agregasi otomatis** Sub-CPMK → CPMK → CPL berdasarkan bobot bertingkat.
- 📈 **Laporan CPL per mahasiswa** dengan **grafik radar (spider chart)**.
- 📤 **Ekspor CSV** laporan capaian per Prodi.
- 👤 **Halaman Admin** untuk kelola Prodi, CPL, CPMK, Sub-CPMK (master).
- 🔑 **Ubah password** mandiri untuk semua user.

---

## Arsitektur

```
┌──────────────────────┐         ┌─────────────────────────────┐
│  Browser (SPA React) │ ──────► │  Lovable Cloud (Supabase)   │
│  Vite build static   │  HTTPS  │  - PostgreSQL + RLS         │
│  React Router        │ ◄────── │  - Auth (JWT)               │
│  TanStack Query      │         │  - Edge Functions (Deno)    │
└──────────────────────┘         └─────────────────────────────┘
```

Frontend adalah **static SPA**: setelah `vite build`, output di `dist/` dapat di-host di server statis manapun, asalkan dapat memanggil URL Lovable Cloud (sudah CORS-enabled).

---

## Model Data

Hierarki utama:

```
Prodi
 └── CPL (Capaian Pembelajaran Lulusan)        [bobot % di level Prodi]
      └── CPMK (Capaian Pembelajaran MK)       [bobot % di level CPL]
           └── Sub-CPMK                        [bobot % di level CPMK]
                └── Sub-CPMK Score             [nilai per mahasiswa]
```

Tabel pendukung: `profiles`, `user_roles`, `courses`, `course_cpl` (mapping MK ↔ CPL), `students`, `enrollments`.

> Bobot bersifat **bertingkat penuh**: agregasi nilai akhir CPL = Σ(nilai CPMK × bobot CPMK pada CPL), dan seterusnya. Admin yang menentukan nilai bobot.

---

## Peran Pengguna

| Role    | Hak Akses                                                                 |
|---------|---------------------------------------------------------------------------|
| `admin` | Kelola Prodi, CPL, CPMK, Sub-CPMK (master), lihat laporan semua Prodi.    |
| `dosen` | Pilih Sub-CPMK per MK, input nilai mahasiswa, lihat hasil agregasi MK.    |

Role disimpan di tabel terpisah `user_roles` (mencegah privilege escalation).

---

## Menjalankan Secara Lokal

**Prasyarat**: Node.js ≥ 18 atau **Bun** ≥ 1.0.

```bash
# 1. Clone repo
git clone <repo-url>
cd <repo>

# 2. Install dependencies
npm install         # atau: bun install

# 3. Siapkan environment (lihat bagian berikut)
cp .env.example .env

# 4. Jalankan dev server
npm run dev         # http://localhost:8080
```

Build & preview produksi:

```bash
npm run build       # output ke dist/
npm run preview     # preview hasil build secara lokal
```

---

## Konfigurasi Environment

File `.env` (project root) dibutuhkan oleh Vite. Variabel **harus** diawali `VITE_` agar terekspos ke client.

```env
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon/publishable-key>"
VITE_SUPABASE_PROJECT_ID="<project-ref>"
```

> **Penting**: `VITE_SUPABASE_PUBLISHABLE_KEY` adalah **anon/publishable key** — aman untuk dikirim ke browser. JANGAN gunakan `service_role` key di frontend.

Pada deployment lewat Lovable, `.env` ini sudah dikelola otomatis. Pada deployment **server terpisah**, Anda harus mendefinisikan variabel ini di environment build platform tujuan.

---

## Struktur Proyek

```
src/
├── App.tsx                    # Routing utama
├── main.tsx                   # Entry point
├── index.css                  # Design tokens (HSL) & Tailwind layers
├── components/
│   ├── AppLayout.tsx          # Sidebar + mobile drawer
│   ├── ProtectedRoute.tsx     # Guard route by auth
│   ├── NavLink.tsx
│   └── ui/                    # shadcn/ui components
├── contexts/AuthContext.tsx   # Session & role provider
├── pages/
│   ├── Auth.tsx               # Login / Signup
│   ├── Dashboard.tsx
│   ├── Courses.tsx
│   ├── CourseDetail.tsx       # Penilaian Sub-CPMK per MK
│   ├── UploadExcel.tsx
│   ├── Admin.tsx              # Tabs: Prodi, CPL, CPMK, Sub-CPMK, Laporan
│   ├── ChangePassword.tsx
│   └── NotFound.tsx
├── lib/
│   ├── excelParser.ts         # Parser Excel akademik
│   └── utils.ts
└── integrations/supabase/     # Auto-generated (JANGAN diedit)
    ├── client.ts
    └── types.ts

supabase/
├── config.toml                # Konfigurasi project & edge functions
├── migrations/                # SQL migrations (auto-deploy)
└── functions/
    └── seed-admin/index.ts    # Edge function: seed akun admin
```

---

## Alur Penggunaan

1. **Admin** login → buka **Administrasi**:
   - Tambahkan **Prodi**.
   - Tambahkan **CPL** dengan bobot per Prodi.
   - Tambahkan **CPMK** dengan bobot per CPL.
   - Tambahkan **Sub-CPMK** dengan bobot per CPMK.
2. **Dosen** login → **Upload Excel** akademik untuk membuat MK + daftar mahasiswa.
3. Pada **Detail MK**, dosen memilih **Sub-CPMK** yang relevan dan memetakan MK ke CPL.
4. Dosen mengisi **nilai per Sub-CPMK** untuk tiap mahasiswa.
5. Sistem otomatis menghitung capaian **CPMK & CPL**.
6. **Admin** membuka **Laporan CPL** untuk melihat tabel & **grafik radar** per mahasiswa, atau **ekspor CSV**.

---

## Akun Admin Default

Pada halaman `/auth`, tekan tautan kecil **"Buat / reset akun admin default"** untuk men-trigger edge function `seed-admin`. Kredensial default:

```
Email   : admin@cpmk.local
Password: Admin123!
```

Setelah login, segera buka **Ubah Password** untuk mengganti kata sandi.

---

## Backend (Lovable Cloud)

Backend sudah dikelola otomatis oleh Lovable Cloud (PostgreSQL + Auth + Edge Functions). Tidak perlu deploy manual:

- **Migrasi DB**: dijalankan otomatis saat file di `supabase/migrations/` berubah.
- **Edge Functions**: dideploy otomatis saat file di `supabase/functions/` berubah.
- **Auth & Storage**: terintegrasi melalui SDK `@supabase/supabase-js`.

Backend **independen dari frontend** — Anda bisa men-deploy frontend di server lain dan tetap menggunakan backend Lovable Cloud yang sama dengan menyetel `VITE_SUPABASE_URL` & `VITE_SUPABASE_PUBLISHABLE_KEY`.

---

## Deploy Frontend

Karena frontend adalah **static SPA**, ada banyak opsi hosting. Yang penting:

1. Build menghasilkan `dist/`.
2. Server harus melakukan **SPA fallback** (semua route → `index.html`) agar deep-link & refresh halaman tidak 404.
3. Environment `VITE_SUPABASE_*` harus di-set saat build.

### Opsi 1: Publish via Lovable

Cara termudah. Klik tombol **Publish** di pojok kanan atas editor Lovable. Aplikasi otomatis live di `https://<project>.lovable.app`. Custom domain bisa dihubungkan via **Project Settings → Domains**.

### Opsi 2: Server Terpisah (Vercel / Netlify / Cloudflare Pages)

#### Vercel

```bash
npm i -g vercel
vercel              # ikuti prompt
vercel --prod
```

Setting yang dibutuhkan di dashboard Vercel:
- **Build command**: `npm run build` (atau `bun run build`)
- **Output directory**: `dist`
- **Environment Variables**: tambah `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.

Tambahkan `vercel.json` di root agar SPA routing bekerja:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

#### Netlify

```bash
npm i -g netlify-cli
netlify deploy --build --prod
```

Buat file `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Set env vars di **Site settings → Environment variables**.

#### Cloudflare Pages

- Connect repo Git → set:
  - Build command: `npm run build`
  - Build output: `dist`
- Tambah env vars di **Settings → Environment variables**.
- SPA fallback otomatis aktif jika ada `_redirects` di `public/`:

```
/*    /index.html   200
```

### Opsi 3: VPS dengan Nginx

```bash
# Di mesin lokal / CI:
npm ci
VITE_SUPABASE_URL="https://xxx.supabase.co" \
VITE_SUPABASE_PUBLISHABLE_KEY="ey..." \
VITE_SUPABASE_PROJECT_ID="xxx" \
npm run build

# Upload folder dist/ ke server:
rsync -avz --delete dist/ user@server:/var/www/nilai-obe/
```

Konfigurasi Nginx (`/etc/nginx/sites-available/nilai-obe`):

```nginx
server {
  listen 80;
  server_name nilai-obe.example.com;
  root /var/www/nilai-obe;
  index index.html;

  # Gzip
  gzip on;
  gzip_types text/plain text/css application/json application/javascript
             text/xml application/xml application/xml+rss text/javascript;

  # Cache aset hashed
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Aktifkan + reload + pasang HTTPS dengan Certbot:

```bash
sudo ln -s /etc/nginx/sites-available/nilai-obe /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d nilai-obe.example.com
```

### Opsi 4: Docker

`Dockerfile`:

```dockerfile
# ===== Build stage =====
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
RUN npm run build

# ===== Runtime stage =====
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

`nginx.conf`:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
}
```

Build & jalankan:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL="https://xxx.supabase.co" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="ey..." \
  --build-arg VITE_SUPABASE_PROJECT_ID="xxx" \
  -t nilai-obe .

docker run -d -p 8080:80 --name nilai-obe nilai-obe
```

### Opsi 5: Static Hosting (S3 / GitHub Pages)

#### AWS S3 + CloudFront

```bash
aws s3 sync dist/ s3://my-bucket --delete
aws cloudfront create-invalidation --distribution-id XXXX --paths "/*"
```

Pada CloudFront, tambahkan **custom error response**: 403 & 404 → `/index.html` dengan status 200 (untuk SPA fallback).

#### GitHub Pages

Karena GitHub Pages tidak mendukung SPA fallback native, gunakan trik `404.html` = copy dari `index.html`:

```bash
npm run build
cp dist/index.html dist/404.html
# push isi dist/ ke branch gh-pages
```

Atau gunakan `HashRouter` (alternatif, mengubah URL jadi `/#/route`).

---

## Testing

```bash
npm run test          # vitest run
npm run test:watch    # mode watch
npm run lint          # eslint
```

---

## Troubleshooting

| Masalah                                       | Solusi                                                                                  |
|-----------------------------------------------|-----------------------------------------------------------------------------------------|
| Refresh halaman → 404                          | Aktifkan SPA fallback (semua route → `index.html`).                                     |
| `Invalid API key` di console                  | Pastikan `VITE_SUPABASE_PUBLISHABLE_KEY` benar dan di-set saat **build** (bukan runtime).|
| Login berhasil tapi role tidak terdeteksi    | Jalankan ulang **seed-admin** atau cek isi tabel `user_roles`.                          |
| Data tidak tampil padahal ada di DB           | Cek **RLS policies** — pastikan user authenticated punya akses.                         |
| Build gagal di CI karena env tidak ditemukan  | Set `VITE_*` sebagai env var di platform CI (bukan hanya `.env` lokal).                 |
| CORS error                                    | Lovable Cloud sudah mengizinkan semua origin; cek URL backend Anda.                     |

---

## Lisensi

Internal — sesuaikan dengan kebijakan institusi Anda.
