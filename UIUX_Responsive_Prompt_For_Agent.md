# Arahan Penambahbaikan UI/UX Responsif untuk AI Agent (Vibe Coding)

**PENTING: BACA ARAHAN INI SEBELUM MENULIS KOD**
Objektif utama tugas ini adalah untuk menaik taraf visual dan menjadikan aplikasi web mesra peranti mudah alih (*mobile-responsive*) serta kemas di skrin laptop (*desktop*). 

**PANTANG LARANG (STRICT CONSTRAINTS):**
1. **JANGAN** sentuh, ubah, atau padam mana-mana fungsi (*functions*) sedia ada.
2. **JANGAN** ubah logik *backend*, *API calls* (terutamanya Supabase), atau pangkalan data (*database*).
3. **JANGAN** ubah pengurusan *state* atau *props* yang menyalurkan data ke komponen.
4. Perubahan hanya dibenarkan pada lapisan CSS, kelas utiliti (seperti Tailwind CSS), dan struktur susun atur HTML/JSX/TSX bagi tujuan reka bentuk responsif (*responsive design*).

---

## Spesifikasi Reka Bentuk Responsif (*Responsive Design Specs*)

Sila laksanakan perubahan UI/UX mengikut komponen berikut berdasarkan spesifikasi saiz skrin (Mobile vs Desktop):

### 1. Halaman Log Masuk (*Login Page*)
*   **Desktop (`md` dan ke atas):** Kekalkan reka bentuk *split-screen* (Gambar / Hero section di sebelah kiri, kotak borang log masuk di sebelah kanan).
*   **Mobile (`sm` dan ke bawah):** Sembunyikan (*hide* menggunakan `hidden`) elemen gambar di sebelah kiri sepenuhnya. Pastikan kotak borang log masuk berada di tengah skrin dan mengambil kelebaran penuh (`w-full` dengan sedikit *padding* `px-4`).

### 2. Kad Metrik Papan Pemuka (*Analytics Dashboard Cards*)
*   **Desktop:** Susun kad metrik (cth: Kadar Pematuhan, Senarai Defisit, Analisis) dalam bentuk *Grid* (2, 3, atau 4 lajur bergantung kepada saiz komponen).
*   **Mobile:** Ubah susunan kepada bentuk menegak (*stacked* / 1 lajur) menggunakan `flex-col` atau `grid-cols-1` supaya teks di dalam kad tidak terpotong atau terhimpit.

### 3. Jadual Senarai Semakan (*Data Table / Queue*) - Fokus UX Utama
Jadual semasa pecah apabila dibuka di peranti pintar. Selesaikan dengan kaedah berikut:
*   **Desktop:** Kekalkan reka bentuk jadual penuh dengan semua lajur (*columns*).
*   **Mobile:** Gunakan pendekatan *Responsive Table*. Balut (*wrap*) elemen `<table>` dengan `div` yang mempunyai ciri *horizontal scroll* (contoh kelas Tailwind: `overflow-x-auto whitespace-nowrap`). 
*   *(Opsional jika AI mampu tanpa merosakkan fungsi)*: Sembunyikan elemen `<table>` pada skrin kecil dan paparkan data menggunakan rupa "Kad" (*Card view*), di mana Nama Guru menjadi tajuk, dan data lain (Subjek, Masa, Status) disenaraikan di dalam kad tersebut.

### 4. Tab Menu & Butang Tindakan (*Tabs & Call-to-Actions*)
*   **Desktop:** Kekalkan paparan butang tab (Menunggu Kelulusan, Telah Diluluskan, dll) bersebelahan secara mendatar.
*   **Mobile:** Pastikan *container* tab tersebut mempunyai *horizontal scroll* (`overflow-x-auto`) dan sembunyikan *scrollbar* visual. 
*   **Mesra Sentuh (*Touch Targets*):** Pastikan semua butang utama (seperti "Simpan Draf", "Hantar E-RPH", "Semak RPH") dan ruangan *input* mempunyai ketinggian minimum **44px** (cth: `min-h-[44px]` atau `py-3`) supaya mudah ditekan menggunakan jari.

### 5. Borang Pengisian (*Form RPH / Teacher Form*)
*   **Desktop:** Gunakan *CSS Grid* untuk membahagikan ruangan *input* yang pendek (seperti Tarikh, Waktu Mula, Waktu Tamat) kepada 2 lajur (`grid-cols-2`). Ini akan memendekkan panjang borang ke bawah.
*   **Mobile:** Pastikan semua ruangan *input*, *dropdown*, dan *textarea* mengambil 100% kelebaran (`w-full` / `grid-cols-1`) dengan jarak margins yang konsisten di sebelah kiri dan kanan.
