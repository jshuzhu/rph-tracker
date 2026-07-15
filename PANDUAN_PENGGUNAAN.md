# Panduan Lengkap Penggunaan Portal E-RPH Tracker

Selamat datang ke **E-RPH Tracker**, sebuah sistem automasi pengurusan Rancangan Pengajaran Harian (RPH) yang direka khas untuk memenuhi piawaian KPM serta memudahkan guru, penyemak, dan pentadbir sekolah.

---

## 📌 Isi Kandungan (Index)

* **[1.0 Pendaftaran Akaun & Log Masuk](#10-pendaftaran-akaun--log-masuk)**
  * [1.1 Cara Mendaftar Akaun Baharu (Sign Up)](#11-cara-mendaftar-akaun-baharu-sign-up)
  * [1.2 Log Masuk Portal (Sign In)](#12-log-masuk-portal-sign-in)
  * [1.3 Set Semula Kata Laluan (Forgot Password)](#13-set-semula-kata-laluan-forgot-password)
* **[2.0 Panduan Penggunaan untuk Guru (Teacher)](#20-panduan-penggunaan-untuk-guru-teacher)**
  * [2.1 Meneroka Dashboard Guru](#21-meneroka-dashboard-guru)
  * [2.2 Membina RPH Baharu (Lalai Sesi/Minggu Automatik)](#22-membina-rph-baharu-lalai-sesiminggu-automatik)
  * [2.3 Menyimpan Draf vs Menghantar RPH](#23-menyimpan-draf-vs-menghantar-rph)
  * [2.4 Memantau Status RPH (Draft, Pending, Approved, Not Approved)](#24-memantau-status-rph-draft-pending-approved-not-approved)
  * [2.5 Membuat Pembetulan RPH yang Ditolak](#25-membuat-pembetulan-rph-yang-ditolak)
  * [2.6 Memuat Turun PDF RPH Rasmi](#26-memuat-turun-pdf-rph-rasmi)
* **[3.0 Panduan Penggunaan untuk Penyemak (Reviewer - Guru Besar / PKP)](#30-panduan-penggunaan-untuk-penyemak-reviewer---guru-besar--pkp)**
  * [3.1 Menetapkan Jawatan / Gelaran (Login Kali Pertama)](#31-menetapkan-jawatan--gelaran-login-kali-pertama)
  * [3.2 Meneroka Dashboard & KPI Penyemak](#32-meneroka-dashboard--kpi-penyemak)
  * [3.3 Menyemak RPH dalam Antrean (Queue)](#33-menyemak-rph-dalam-antrean-queue)
  * [3.4 Meluluskan RPH atau Meminta Pembetulan (Dengan Ulasan)](#34-meluluskan-rph-atau-meminta-pembetulan-dengan-ulasan)
  * [3.5 Analisis & Statistik Pematuhan (Analytics)](#35-analisis--statistik-pematuhan-analytics)
* **[4.0 Panduan Penggunaan untuk Pentadbir (Admin)](#40-panduan-penggunaan-untuk-pentadbir-admin)**
  * [4.1 Meneroka Dashboard Pentadbir](#41-meneroka-dashboard-pentadbir)
  * [4.2 Mengurus Profil & Logo Sekolah](#42-mengurus-profil--logo-sekolah)
  * [4.3 Tetapan Sesi Akademik & Minggu Automatik](#43-tetapan-sesi-akademik--minggu-automatik)
  * [4.4 Mengurus Peranan Pengguna (Menukar Guru → Penyemak/Admin)](#44-mengurus-peranan-pengguna-menukar-guru--penyemakadmin)
  * [4.5 Mengurus Data Master (Tambah Subjek & Kelas Baharu)](#45-mengurus-data-master-tambah-subjek--kelas-baharu)

---

## 1.0 Pendaftaran Akaun & Log Masuk

### 1.1 Cara Mendaftar Akaun Baharu (Sign Up)
1. Layari halaman utama web dan klik pautan **Daftar Akaun di sini** di bawah kotak log masuk.
2. Masukkan **Nama Penuh** anda (Contoh: `Ahmad bin Yusof` — *jangan letakkan perkataan Cikgu/En/Pn kerana sistem akan menambahkannya secara automatik mengikut peranan*).
3. Masukkan **E-mel** rasmi anda dan bina **Kata Laluan** (minimum 6 aksara).
4. Klik **Daftar Akaun**. Akaun anda secara automatik akan didaftarkan sebagai **Guru** terlebih dahulu.

### 1.2 Log Masuk Portal (Sign In)
1. Masukkan **E-mel** dan **Kata Laluan** anda pada borang log masuk utama.
2. Klik **Log Masuk**.
3. Sistem akan membaca peranan akaun anda daripada database dan mengarahkan anda ke portal yang betul secara automatik:
   * Portal Guru (`/dashboard`)
   * Portal Penyemak (`/reviewer`)
   * Portal Admin (`/admin`)

### 1.3 Set Semula Kata Laluan (Forgot Password)
1. Jika terlupa kata laluan, klik **Lupa Kata Laluan?** di atas input kata laluan.
2. Masukkan e-mel anda dan klik **Hantar Pautan**.
3. Pautan set semula akan dihantar ke e-mel anda untuk membina kata laluan baharu.

---

## 2.0 Panduan Penggunaan untuk Guru (Teacher)

### 2.1 Meneroka Dashboard Guru
Halaman utama guru memaparkan:
* **Status Sesi & Minggu Semasa**: Cth: `[SESI 2026 : MINGGU 1]` di bahagian atas.
* **Kad Ringkasan KPI**: Jumlah RPH, RPH Pending (Menunggu Semakan), RPH Approved (Lulus), dan RPH Not Approved (Perlu Pembetulan).
* **Butang Tindakan Pantas**: Bina RPH Baharu, Urus Rekod RPH (Queue), dan Analisis Laporan.

### 2.2 Membina RPH Baharu (Lalai Sesi/Minggu Automatik)
1. Klik **Tulis RPH Baharu** dari dashboard.
2. Borang akan dipaparkan. Maklumat **Sesi Akademik** dan **Minggu** telah diisi secara automatik mengikut tetapan sekolah semasa.
3. Pilih **Subjek** dan **Kelas** yang diajar.
4. Pilih **Tarikh Pengajaran**, serta **Waktu Mula** dan **Waktu Tamat**.
   > [!IMPORTANT]
   > Sistem dilengkapi fungsi **Time Clash Prevention**. Jika anda memilih waktu yang bertindih dengan RPH anda yang lain pada hari yang sama, sistem akan mengeluarkan amaran dan menghalang penyimpanan untuk mengelakkan ralat jadual waktu.
5. Masukkan **Standard Kandungan**, **Standard Pembelajaran**, **Objektif**, **Aktiviti**, **Bahan Bantu Mengajar (BBM)**, dan **Refleksi** (jika ada).

### 2.3 Menyimpan Draf vs Menghantar RPH
* **Simpan Draf**: Jika RPH belum lengkap, klik **Simpan Draf**. RPH ini hanya boleh dilihat dan diedit oleh anda sahaja. Ia tidak akan muncul dalam senarai penyemak.
* **Hantar RPH**: Jika RPH telah lengkap dan sedia untuk disemak, klik **Hantar untuk Semakan**. Status RPH akan bertukar menjadi **Pending** dan dihantar ke antrean semakan pentadbir.

### 2.4 Memantau Status RPH (Draft, Pending, Approved, Not Approved)
Pergi ke halaman **Urus Rekod RPH (Queue)** untuk melihat senarai RPH anda:
* ⚪ **Draf (Draft)**: Masih dalam proses penulisan.
* 🟡 **Menunggu (Pending)**: RPH telah dihantar dan sedang menunggu semakan Guru Besar/PKP.
* 🟢 **Lulus (Approved)**: RPH telah disemak, diluluskan, dan sedia dicetak.
* 🔴 **Pembetulan (Not Approved)**: RPH ditolak oleh penyemak dan memerlukan pembetulan (ulasan penyemak akan dipaparkan).

### 2.5 Membuat Pembetulan RPH yang Ditolak
1. Cari RPH berstatus 🔴 **Not Approved** dalam senarai anda.
2. Klik ikon/butang **Edit** pada RPH tersebut.
3. Rujuk ulasan penyemak pada bahagian **Ulasan Penyemak**.
4. Lakukan pembetulan pada objektif, aktiviti, atau mana-mana bahagian yang dinyatakan.
5. Klik **Hantar Semula** untuk menukar status kembali kepada **Pending**.

### 2.6 Memuat Turun PDF RPH Rasmi
1. Klik pada mana-mana RPH berstatus 🟢 **Approved** untuk melihat perincian penuhnya.
2. Klik butang **Muat Turun PDF**.
3. Sistem akan menghasilkan dokumen PDF yang kemas, lengkap dengan logo sekolah, maklumat minggu/sesi, dan tandatangan/stamp kelulusan penyemak (Nama & Jawatan).

---

## 3.0 Panduan Penggunaan untuk Penyemak (Reviewer - Guru Besar / PKP)

### 3.1 Menetapkan Jawatan / Gelaran (Login Kali Pertama)
Apabila akaun dinaik taraf sebagai Penyemak, semasa log masuk kali pertama, satu modal akan muncul meminta anda memilih gelaran rasmi anda:
* **Guru Besar (GB)**
* **PK Pentadbiran (PKP)**
* **PK HEM**
* **PK Kokurikulum (PK KO)**
Pilihan ini sangat penting kerana nama dan gelaran ini akan dicetak secara dinamik pada PDF RPH guru yang anda sahkan.

### 3.2 Meneroka Dashboard & KPI Penyemak
Dashboard Penyemak memaparkan:
* **KPI Semakan**: Menunjukkan bilangan RPH Menunggu Semakan, RPH yang telah diluluskan, dan RPH dalam pembetulan.
* **Pautan Pantas**: Senarai Semakan (Queue) dan Laporan Analisis.

### 3.3 Menyemak RPH dalam Antrean (Queue)
1. Klik **Senarai Semakan (Queue)**.
2. Gunakan filter di bahagian atas untuk menapis RPH mengikut **Nama Guru**, **Minggu**, atau **Status**.
3. Klik pada mana-mana RPH yang berstatus 🟡 **Pending** untuk membukanya.

### 3.4 Meluluskan RPH atau Meminta Pembetulan (Dengan Ulasan)
Setelah membaca RPH guru, tatal ke bawah ke bahagian **Tindakan Penyemak**:
* **Ulasan/Catatan**: Masukkan ulasan atau maklum balas anda (wajib jika menolak RPH).
* **Butang Sahkan & Lulus (Approve)**: RPH akan diluluskan. Nama dan jawatan anda akan dicetak pada fail PDF guru sebagai penyemak yang sah.
* **Butang Mohon Pembetulan (Reject)**: RPH akan ditolak. Sistem akan menghantar RPH kembali ke portal guru dengan status **Not Approved** beserta ulasan anda untuk dibetulkan.

### 3.5 Analisis & Statistik Pematuhan (Analytics)
Halaman Analisis Penyemak membolehkan anda memantau pematuhan guru secara makro:
* **Deficit List**: Menunjukkan nama guru-guru yang belum menghantar RPH bagi minggu semasa.
* **Rejection Heatmap**: Peratusan RPH yang diluluskan vs ditolak.

---

## 4.0 Panduan Penggunaan untuk Pentadbir (Admin)

### 4.1 Meneroka Dashboard Pentadbir
Dashboard Admin memaparkan ringkasan data master sekolah:
* Jumlah Pengguna Berdaftar, Jumlah Subjek Aktif, Jumlah Kelas, dan Jumlah RPH keseluruhan.
* Pautan ke Pengurusan Pengguna, Pengurusan Master Data, dan Tetapan Sekolah.

### 4.2 Mengurus Profil & Logo Sekolah
1. Klik **Tetapan Sekolah** dari menu tepi atau dashboard.
2. Masukkan **Nama Rasmi Sekolah** (cth: `Sekolah Rendah Agama Seri Kinabalu`).
3. Klik **Muat Naik Logo** untuk memilih fail gambar logo sekolah (format PNG/JPG, maksimum 2MB).
4. Klik **Simpan Tetapan**. Logo ini akan dicetak pada bahagian atas setiap fail PDF RPH guru.

### 4.3 Tetapan Sesi Akademik & Minggu Automatik
Di halaman Tetapan Sekolah, anda tidak perlu lagi menukar minggu secara manual setiap hari Isnin:
1. Tetapkan **Tarikh Mula Sesi** akademik (cth: `2026-03-09`).
2. Tetapkan **Tarikh Tamat Sesi** (cth: `2027-02-05`).
3. Masukkan **Minggu Cuti Sekolah** (cth: masukkan `1` jika penggal cuti pertama selama seminggu telah dilalui).
4. Sistem akan memaparkan **Minggu Semasa (Auto)** secara langsung. Minggu ini akan bertukar secara automatik setiap 7 hari tanpa perlu ditukar secara manual.
5. Klik **Simpan Tetapan**.

### 4.4 Mengurus Peranan Pengguna (Menukar Guru → Penyemak/Admin)
Apabila ada staf/guru mendaftar akaun baharu:
1. Pergi ke halaman **Pengurusan Pengguna (Peranan Guru)**.
2. Cari nama guru tersebut dalam senarai dan klik butang **Ubah Role**.
3. Pilih peranan yang sesuai:
   * **Guru**: Hak akses untuk menulis RPH sahaja.
   * **Penyemak (Reviewer)**: Hak akses untuk menyemak dan meluluskan RPH. (Anda perlu memilih gelaran jawatan mereka seperti *Guru Besar* atau *PKP*).
   * **Pentadbir (Admin)**: Hak akses penuh mengurus sistem.
4. Klik **Simpan Peranan**.

### 4.5 Mengurus Data Master (Tambah Subjek & Kelas Baharu)
Di bawah tab **Subjek** dan **Kelas** di portal Admin:
* **Tambah Subjek**: Masukkan Kod Subjek (cth: `BI02`) dan Nama Subjek (cth: `Bahasa Inggeris`), kemudian klik **Tambah**.
* **Tambah Kelas**: Masukkan Tahun/Tingkatan (cth: `Tahun 1`) dan Nama Kelas (cth: `1 Arif`), kemudian klik **Tambah**.
* Pendaftaran ini akan terus dikemas kini dan dipaparkan dalam borang penulisan RPH guru secara masa nyata (*realtime*).
