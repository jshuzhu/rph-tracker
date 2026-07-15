# Mobile-First Architecture & UX Refactor Guideline
## Sistem: E-RPH (RPH Tracker) — Next.js + Supabase + Tailwind CSS v4

---

## 0. TUJUAN DOKUMEN

Dokumen ini adalah rujukan rasmi untuk AI Agent (Claude Code / sebarang AI coding agent) yang akan menjalankan **rombakan (refactor) UI/UX** ke atas aplikasi E-RPH sedia ada.

Fokus rombakan ini adalah **struktur frontend, routing, dan komponen paparan sahaja**. Ini BUKAN rombakan sistem, BUKAN rombakan logik perniagaan, dan BUKAN rombakan pangkalan data.

Baca dan patuhi **Seksyen 1 (Pantang Larang)** sebelum menyentuh mana-mana fail.

---

## 1. PANTANG LARANG (HARD CONSTRAINTS) ⛔

AI Agent **MESTI PATUH SEPENUHNYA** kepada sekatan berikut. Sebarang pelanggaran dianggap sebagai regresi kritikal.

1. **JANGAN** ubah sebarang logik backend/business logic — termasuk fungsi dalam `route.js` (API routes), fungsi Supabase (`select`, `insert`, `update`, `rpc`, dsb.), dan pengiraan/validasi data sedia ada.
2. **JANGAN** ubah skema pangkalan data Supabase (nama jadual, nama lajur, RLS policies, triggers, foreign keys). Struktur data yang dihantar/diterima dari Supabase mesti kekal 100% serasi (backward compatible).
3. **JANGAN** ubah logik pengesahan (`AuthProvider`, `authGuard.js`) dari segi *behaviour* — peranan (`admin`, `reviewer`, guru/default) mesti kekal berfungsi seperti sedia ada. Rombakan hanya dibenarkan pada **cara UI memaparkan hasil** logik ini (contohnya menukar `router.replace('/admin')` kepada `router.replace('/admin/dashboard')` adalah dibenarkan kerana ia laluan/routing, tetapi logik role-check itu sendiri tidak boleh diubah).
4. **JANGAN** buang (delete) sebarang fungsi utama sedia ada (hantar emel via Resend, reset password, toggle tema, papar nama sekolah/logo, dsb). Fungsi ini hanya boleh **dipindahkan** ke halaman/komponen baru, bukan dihapuskan.
5. **JANGAN** tukar library/framework teras (Next.js App Router, Supabase client, Tailwind CSS v4, Resend). Rombakan ini adalah reorganisasi struktur, bukan migrasi teknologi.
6. **KEKALKAN** semua environment variables dan nama fail konfigurasi (`.env`, `RESEND_API_KEY`, dsb.) tanpa perubahan.
7. **KEKALKAN** semua teks/label Bahasa Melayu sedia ada (contoh: "Log Keluar", "Mengesahkan Sesi...", "Borang Guru") melainkan diarahkan khusus untuk menambah baik UX teks tersebut.
8. Sebarang perubahan pada `authGuard.js` atau `AuthProvider` untuk menyokong routing baharu **mesti** dibuat secara **tambahan (additive)** — tambah laluan/halaman baharu ke dalam senarai kebenaran sedia ada, bukan menulis semula logik pengesahan dari awal.
9. Jika satu ciri sedia ada (cth: carta analitik) tiada tempat jelas dalam struktur baharu, **JANGAN padam ciri itu** — letakkan ia di halaman `/dashboard/analytics` yang berkaitan.

> **Prinsip Teras:** "Pindah rumah, bukan bakar rumah." Semua data, fungsi, dan logik sedia ada mesti terus wujud — hanya susun atur dan cara paparan yang berubah.

---

## 2. MASALAH SEDIA ADA (CONTEXT)

- UI sedia ada memuatkan borang, jadual, dan carta analitik dalam **satu paparan tunggal (single-page dump)**.
- Ini menyebabkan skrin sesak, sukar untuk *scroll*, dan tidak praktikal di peranti mudah alih.
- Terdapat 3 peranan pengguna: `admin`, `reviewer`, dan guru (default/tiada role khusus) — lihat `authGuard.js`.
- Navigasi sedia ada (`Navbar.js`) menggunakan navigasi mendatar (top nav) yang direka untuk desktop (`hidden md:flex`), dan tiada padanan mobile yang setara secara fungsian.

---

## 3. STRUKTUR ROUTING BAHARU (FILE-BASED ROUTING)

Gunakan **Next.js App Router** sedia ada. Pecahkan setiap fungsi besar kepada laluan (route) tersendiri berasaskan peranan dan tujuan.

```
app/
├── layout.js                          # Root layout (kekal — AuthProvider + AuthGuard)
├── login/
│   └── page.js                        # Log masuk (sedia ada, kekal)
├── reset-password/
│   └── page.js                        # Reset kata laluan (sedia ada, kekal)
│
├── (guru)/                            # Route group untuk peranan Guru
│   └── dashboard/
│       ├── page.js                    # Dashboard ringkas Guru (kad ringkasan + CTA)
│       ├── queue/
│       │   └── page.js                # Senarai RPH (dahulunya jadual besar)
│       ├── analytics/
│       │   └── page.js                # Carta analisis prestasi RPH
│       └── notifications/
│           └── page.js                # (opsyenal) senarai notifikasi/emel status
│
├── rph/
│   ├── new/
│   │   └── page.js                    # Borang Isi RPH (borang penuh, halaman berasingan)
│   └── [id]/
│       ├── page.js                    # Papar butiran satu RPH
│       └── edit/
│           └── page.js                # Edit RPH sedia ada
│
├── admin/
│   ├── dashboard/
│   │   └── page.js                    # Dashboard ringkas Admin (kad ringkasan + CTA)
│   ├── queue/
│   │   └── page.js                    # Senarai semua RPH untuk semakan
│   ├── analytics/
│   │   └── page.js                    # Analisis keseluruhan sekolah
│   ├── teachers/
│   │   └── page.js                    # Pengurusan senarai guru
│   └── settings/
│       └── page.js                    # Tetapan sekolah (nama, logo — school_settings)
│
├── reviewer/
│   ├── dashboard/
│   │   └── page.js                    # Dashboard ringkas Reviewer
│   ├── queue/
│   │   └── page.js                    # Senarai RPH menunggu semakan
│   └── analytics/
│       └── page.js                    # Analisis semakan
│
└── api/
    └── send-email/
        └── route.js                   # (sedia ada, kekal — Resend API)
```

### Nota Migrasi Routing
- Laluan asas `/admin`, `/reviewer`, `/` (guru) yang wujud dalam `authGuard.js` perlu **dikemaskini secara additive** kepada `/admin/dashboard`, `/reviewer/dashboard`, `/dashboard` — pastikan semua `router.replace(...)` dan semakan `pathname.startsWith(...)` turut dikemaskini serentak supaya logik role-guard tidak pecah.
- Setiap laluan `queue` dan `analytics` mesti disemak oleh `authGuard.js` mengikut peranan yang sama seperti laluan induk (`/admin/queue` tertakluk kepada semakan `role === 'admin'`, dan seterusnya).
- Borang isi RPH (`/rph/new`) dan lihat/edit (`/rph/[id]`, `/rph/[id]/edit`) adalah **laluan kongsi** — boleh diakses oleh guru (RPH sendiri) dan admin/reviewer (mengikut kebenaran sedia ada dalam logik backend, tidak diubah).

---

## 4. REKA BENTUK MOBILE-FIRST (UI/UX SPEC)

### 4.1 Prinsip Umum
- Reka bentuk **mobile-first**: rekas untuk lebar skrin 360–430px dahulu, kemudian *scale up* ke tablet/desktop menggunakan Tailwind breakpoints (`sm:`, `md:`, `lg:`).
- Setiap halaman (`/dashboard`, `/queue`, `/analytics`, `/rph/new`) hanya fokus kepada **satu tujuan**. Jangan gabungkan borang + jadual + carta dalam satu `page.js`.
- Kekalkan gaya visual sedia ada: palet `slate-900/950`, aksen `blue-600`/`purple-400`/`emerald`, sudut bulat (`rounded-xl`/`rounded-2xl`), bayang lembut (`shadow-lg`/`shadow-2xl`), dan animasi `fadeIn`/`slideUp` yang sudah ditakrifkan dalam `globals.css`.

### 4.2 Card-Based Design (Ganti Jadual)
- Semua jadual (`<table>`) untuk senarai RPH mesti digantikan dengan **senarai kad (card list)** pada paparan mobile:
  - Satu kad = satu rekod RPH.
  - Kandungan kad minimum: Tajuk/Mata Pelajaran, Tarikh, Status (Pill/Badge berwarna — guna corak badge sedia ada dari `Navbar.js`, cth. `bg-emerald-950/40 text-emerald-300 border-emerald-800`), dan satu CTA ("Lihat" / "Edit").
  - Susun atur kad: `flex flex-col space-y-3` pada mobile, boleh bertukar kepada grid (`sm:grid sm:grid-cols-2 lg:grid-cols-3`) pada skrin lebih besar.
- Jadual (`<table>`) hanya dibenarkan sebagai **pilihan pandangan alternatif ("Table View")** pada breakpoint `lg:` ke atas, bukan sebagai paparan default mobile.

### 4.3 Bottom Navigation Bar (Mobile)
- Tambah komponen baharu `BottomNav.js` yang hanya kelihatan pada mobile (`md:hidden`), *fixed* di bahagian bawah skrin (`fixed bottom-0 inset-x-0 z-50`).
- Kandungan Bottom Nav mengikut peranan:
  - **Guru:** Dashboard | Senarai RPH | + (Isi RPH — CTA utama, ditinggikan/circle) | Analisis | Profil.
  - **Admin/Reviewer:** Dashboard | Senarai/Queue | Analisis | Guru/Tetapan | Profil.
- `Navbar.js` sedia ada (top nav) dikekalkan **hanya untuk desktop** (`hidden md:flex` menjadi corak sebaliknya — top nav disembunyikan pada mobile, digantikan Bottom Nav).
- Ikon guna set SVG sedia ada (gaya `heroicons` outline, `strokeWidth={1.8-2}`) supaya konsisten dengan ikon dalam `Navbar.js` dan `page.js` (reset-password).

### 4.4 Saiz Sentuhan (Touch Target)
- Semua butang CTA, item Bottom Nav, dan elemen boleh-klik mesti mempunyai **tinggi/lebar minimum 48px** (`min-h-[48px] min-w-[48px]` atau `py-3 px-4` setara).
- Jarak minimum antara elemen boleh-klik bersebelahan: 8px (`gap-2`) untuk elak salah-tekan (mis-tap).
- Butang utama (Primary CTA) seperti "Isi RPH Baharu" mesti berada di zon ibu jari mudah capai (bahagian bawah/tengah skrin), bukan di penjuru atas.

### 4.5 Dashboard Ringkas (Landing Page Selepas Log Masuk)
- `/dashboard` (dan padanan `/admin/dashboard`, `/reviewer/dashboard`) **TIDAK** memaparkan jadual penuh atau carta terperinci.
- Kandungan dashboard terhad kepada:
  1. Ucapan ringkas + nama pengguna (guna `profile.full_name` sedia ada).
  2. 2–4 **kad ringkasan statistik** (cth: "Jumlah RPH Bulan Ini", "Menunggu Semakan", "Diluluskan") — angka besar, label kecil, gaya kad sedia ada.
  3. Grid butang besar (Big Action Cards, bukan link teks kecil) untuk navigasi ke `queue`, `analytics`, `rph/new` — setiap butang minimum tinggi 88–100px, ikon + label, guna gaya gradient/shadow yang sudah ada pada logo di `Navbar.js` (`bg-gradient-to-tr from-blue-600 to-indigo-500`).
- Carta analitik penuh (graf, trend) **dipindahkan sepenuhnya** ke `/dashboard/analytics` — jangan render carta berat terus di dashboard utama demi prestasi mobile.

---

## 5. ALIRAN PENGGUNA (USER FLOW)

### 5.1 Carta Alir Umum
```
[Muka Depan / "/"]
      │
      ▼
 Log Masuk ("/login")
      │
      ▼
 authGuard.js semak `profile.role`
      │
      ├── role = admin      → redirect "/admin/dashboard"
      ├── role = reviewer   → redirect "/reviewer/dashboard"
      └── role = guru/lain  → redirect "/dashboard"
```

### 5.2 Aliran Guru
```
/dashboard (ringkasan + kad statistik)
   ├─→ [Kad: "Isi RPH Baharu"] → /rph/new (borang penuh)
   │                                  └─→ Submit → redirect → /dashboard/queue (papar rekod baru)
   ├─→ [Kad: "Senarai RPH Saya"] → /dashboard/queue (senarai kad, ganti jadual)
   │                                  └─→ [Tap kad] → /rph/[id] (butiran) → /rph/[id]/edit
   └─→ [Bottom Nav: "Analisis"] → /dashboard/analytics (carta prestasi RPH sendiri)
```

### 5.3 Aliran Admin
```
/admin/dashboard (ringkasan sekolah + kad statistik keseluruhan)
   ├─→ [Kad: "Semak RPH"] → /admin/queue (senarai kad semua guru, boleh tapis status)
   │                              └─→ [Tap kad] → /rph/[id] (semak + lulus/tolak)
   ├─→ [Kad: "Analisis Sekolah"] → /admin/analytics (carta keseluruhan)
   ├─→ [Bottom Nav: "Guru"] → /admin/teachers (urus senarai guru)
   └─→ [Bottom Nav: "Tetapan"] → /admin/settings (nama sekolah, logo — school_settings)
```

### 5.4 Aliran Reviewer
```
/reviewer/dashboard (ringkasan tugasan semakan)
   ├─→ [Kad: "Queue Semakan"] → /reviewer/queue (senarai kad RPH menunggu semakan)
   │                                  └─→ [Tap kad] → /rph/[id] (semak + komen/lulus)
   └─→ [Bottom Nav: "Analisis"] → /reviewer/analytics
```

### 5.5 Prinsip Navigasi Balik (Back Navigation)
- Setiap halaman peringkat-2 (`queue`, `analytics`, `rph/new`, `rph/[id]`) mesti ada butang "Kembali" (`← Kembali`) di bahagian atas, mengarah ke dashboard induk mengikut peranan — elakkan pengguna terperangkap tanpa jalan keluar jelas, terutama kerana Bottom Nav mungkin tertutup papan kekunci semasa mengisi borang.
- Selepas tindakan berjaya (submit borang, lulus RPH), redirect pengguna ke halaman **queue/senarai**, bukan kembali ke dashboard — supaya mereka nampak kesan tindakan mereka serta-merta (konsisten dengan corak sedia ada dalam `reset-password/page.js` yang redirect selepas 3 saat dengan mesej kejayaan).

---

## 6. SENARAI TINDAKAN UNTUK AI AGENT (IMPLEMENTATION CHECKLIST)

1. [ ] Cipta struktur folder baharu di bawah `app/` mengikut Seksyen 3, tanpa memadam fail sedia ada sebelum kandungan dipindah sepenuhnya.
2. [ ] Pindahkan (bukan tulis semula) logik pengambilan data Supabase sedia ada ke halaman/komponen baharu yang berkaitan.
3. [ ] Cipta komponen `BottomNav.js` mobile-only, mengikut peranan pengguna (guna `useAuth()` sedia ada).
4. [ ] Ubah `Navbar.js` supaya nav mendatar hanya kelihatan pada `md:` ke atas; padankan dengan Bottom Nav pada mobile.
5. [ ] Kemaskini `authGuard.js` secara **additive** untuk mengenali laluan baharu (`/dashboard`, `/admin/dashboard`, `/reviewer/dashboard`, `/rph/*`) tanpa mengubah logik teras role-check.
6. [ ] Tukar semua paparan jadual sedia ada kepada senarai kad pada breakpoint mobile (`< md`), kekalkan/opsyenkan table view pada `lg:` ke atas jika perlu.
7. [ ] Pastikan semua CTA utama ≥ 48px tinggi/lebar.
8. [ ] Uji setiap aliran (Seksyen 5) end-to-end selepas rombakan: log masuk → dashboard → navigasi ke setiap sub-halaman → tindakan (submit/lulus) → redirect.
9. [ ] Sahkan tiada fungsi (Resend email, reset password, theme toggle, school info) hilang selepas rombakan — semak senarai fungsi dalam Seksyen 1.

---

## 7. KRITERIA KEJAYAAN (DEFINITION OF DONE)

- ✅ Tiada satu pun halaman memaparkan borang + jadual + carta serentak dalam satu skrin.
- ✅ Semua CTA utama boleh ditekan selesa dengan ibu jari pada skrin 360px lebar.
- ✅ Navigasi antara dashboard ↔ queue ↔ analytics ↔ rph/new berfungsi untuk ketiga-tiga peranan (guru/admin/reviewer).
- ✅ Tiada perubahan pada struktur/nama jadual Supabase.
- ✅ Tiada fungsi backend/API (`route.js`, Resend, auth) yang rosak atau hilang.
- ✅ Semua teks Bahasa Melayu sedia ada dikekalkan atau ditambah baik secara konsisten dari segi nada bahasa.
