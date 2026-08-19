# Dashboard Pelatihan Minggu Depan

![Preview dashboard](preview-v3.png)

Dashboard web GIA Corpu/BPKP untuk menyajikan informasi pelatihan kepada pimpinan. Aplikasi hanya memiliki dua fungsi utama:

1. **Upload data** dari Excel (`.xlsx`/`.xls`) atau CSV.
2. **Dashboard** berisi KPI, grafik lokasi dan jenis pelatihan, highlight, filter, pencarian, daftar lengkap dalam satu halaman, serta detail setiap pelatihan.


## Perubahan versi 3

- Palet antarmuka menggunakan nuansa biru-merah GIA Corpu/BPKP.
- Kartu **Total Kelas Pelatihan** menampilkan jumlah seluruh kelas sebagai angka utama dan jumlah judul pelatihan sebagai angka pendamping.
- Kartu **Kelas Akan Dilaksanakan** menampilkan total kelas yang akan dilaksanakan serta jumlah pelatihannya.
- Kartu **Kelas Dalam Konfirmasi** dan **Kelas Dibatalkan** dihitung berdasarkan kolom **Jumlah Kelas**. Persentasenya juga menggunakan total kelas sebagai pembanding.
- Panel **Highlight Pelatihan** memiliki tombol **Tambah/Edit Catatan**. Catatan manual disimpan pada `localStorage` browser.
- Seluruh daftar pelatihan yang sesuai filter ditampilkan sekaligus tanpa pagination.
- Tabel diurutkan otomatis berdasarkan status **Akan Dilaksanakan → Dalam Konfirmasi → Dibatalkan**, kemudian **Tanggal Mulai** paling awal, lalu **Kode** terkecil dengan pengurutan angka alami.

## Teknologi

- Backend: FastAPI (Python)
- Pengolahan data: pandas, openpyxl, xlrd
- Frontend: HTML, CSS, dan JavaScript murni
- Grafik: SVG dan CSS, tanpa library grafik eksternal

File yang diunggah diproses di memori dan tidak disimpan oleh server. Hasil normalisasi beserta catatan highlight disimpan pada `localStorage` browser agar dashboard tetap tampil setelah halaman dimuat ulang.

## Struktur proyek

```text
dashboard-pelatihan/
├── app.py
├── requirements.txt
├── run.bat
├── run.sh
├── static/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── tests/
    └── test_parser.py
```

## Menjalankan di Windows

Buka Command Prompt atau PowerShell pada folder proyek, lalu jalankan:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload
```

Atau klik dua kali `run.bat`. Setelah server aktif, buka:

```text
http://127.0.0.1:8000
```

## Menjalankan di macOS/Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

Atau:

```bash
chmod +x run.sh
./run.sh
```

## Format kolom yang dikenali

Aplikasi mengenali beberapa variasi nama kolom. Nama yang direkomendasikan:

| Kolom | Wajib | Keterangan |
|---|---:|---|
| Kode | Tidak | Kode atau ID pelatihan |
| Status | Tidak | Contoh: Realisasi, Dalam Konfirmasi, Dibatalkan |
| Jenis Pelatihan | Tidak | Contoh: JFA, SN-FA |
| Pembiayaan | Tidak | Contoh: PNBP, ABT |
| Lokasi | Tidak | Lokasi atau unit penyelenggara |
| Jumlah Kelas | Tidak | Jika kosong, dianggap 1 |
| Judul Pelatihan | Ya | Nama lengkap pelatihan |
| Tanggal Mulai | Ya | Tanggal pelaksanaan mulai |
| Akhir TM | Tidak | Tanggal akhir tatap muka/program |

Header tidak harus berada pada baris pertama. Aplikasi mencari baris header pada 20 baris awal file dan menggunakan sheet pertama yang berisi data.

## Pengelompokan status

- Status yang mengandung `batal` atau `cancel` menjadi **Dibatalkan**.
- Status yang mengandung `konfirmasi`, `pending`, `proses`, `tentatif`, atau `menunggu` menjadi **Dalam Konfirmasi**.
- Status lainnya, termasuk `Realisasi`, menjadi **Akan Dilaksanakan**.

Aturan tersebut dapat diubah pada fungsi `normalize_status()` di `app.py`.

## Periode dashboard

Tersedia pilihan:

- Rentang tanggal yang terdapat pada file
- Minggu ini
- Minggu depan
- Semua data
- Rentang tanggal khusus

Setelah upload, aplikasi otomatis memilih **Minggu depan** bila terdapat data pada minggu depan. Jika tidak, aplikasi menggunakan **Rentang data** agar dashboard tidak langsung kosong.

## Pengujian parser

```bash
python -m unittest discover -s tests -v
```

## Penyesuaian tampilan

- Warna, ukuran, dan layout: `static/styles.css`
- Teks, menu, dan struktur dashboard: `static/index.html`
- Perhitungan KPI, grafik, filter, catatan highlight, dan tabel: `static/app.js`
- Aturan pembacaan Excel/CSV: `app.py`

## Catatan deployment

Untuk server internal, jalankan:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

Akses dapat dibatasi melalui reverse proxy, VPN, atau autentikasi organisasi sesuai lingkungan tempat aplikasi dipasang.

## Deployment ke Vercel

Versi ini telah dilengkapi dengan konfigurasi Vercel:

- `app.py` sebagai entrypoint FastAPI.
- `vercel.json` untuk preset FastAPI, penyertaan aset statis, dan batas durasi fungsi.
- `.python-version` untuk menggunakan Python 3.12.
- `.vercelignore` agar file pengembangan tidak ikut dibundel.
- Batas unggah 4 MB agar tetap berada di bawah batas payload Vercel Functions 4,5 MB, termasuk overhead multipart.

### Opsi 1: GitHub dan Vercel Dashboard

1. Unggah seluruh isi folder ini ke root sebuah repository GitHub. Pastikan `app.py`, `requirements.txt`, dan `vercel.json` berada langsung di root repository.
2. Di Vercel, pilih **Add New → Project** lalu import repository tersebut.
3. Pastikan Framework Preset terdeteksi sebagai **FastAPI**. Build Command dan Output Directory dibiarkan kosong/default.
4. Klik **Deploy**.
5. Setelah selesai, uji endpoint `/api/health` dan lakukan satu kali upload file dari halaman dashboard.

Apabila repository masih memiliki folder pembungkus `dashboard-pelatihan-vercel/`, atur **Root Directory** ke folder tersebut sebelum deploy.

### Opsi 2: Vercel CLI

```bash
npm install -g vercel
cd dashboard-pelatihan-vercel
vercel
vercel --prod
```

### Catatan penyimpanan data

File yang diunggah diproses sementara oleh FastAPI, lalu data hasilnya disimpan pada `localStorage` browser. Artinya:

- data tidak disimpan permanen di server Vercel;
- data hanya terlihat pada browser/perangkat yang melakukan upload;
- pengguna yang membuka URL dari perangkat lain perlu melakukan upload sendiri.

Untuk dashboard bersama yang selalu menampilkan data yang sama kepada semua pengguna, tambahkan penyimpanan terpusat seperti database atau object storage serta autentikasi admin.
