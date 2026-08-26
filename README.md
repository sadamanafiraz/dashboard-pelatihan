# Dashboard Pelatihan GIA Corpu/BPKP — NeonDB

Dashboard FastAPI untuk menampilkan data pelatihan mingguan yang tersimpan terpusat di Neon Postgres. Semua pengguna melihat dataset yang sama, dapat memilih minggu yang tersedia di database, dan melihat KPI, grafik, highlight, filter, serta daftar pelatihan lengkap.

## Fitur utama

- Upload XLSX, XLS, atau CSV maksimal 4 MB.
- Hasil upload disimpan ke NeonDB sebagai **snapshot lengkap**.
- Pilihan minggu dibuat otomatis dari kolom `Tanggal Mulai` di database.
- Dashboard otomatis memilih Minggu Depan, Minggu Ini, minggu terdekat di masa depan, atau minggu terakhir yang tersedia.
- KPI kelas dan jumlah judul pelatihan.
- Status dan tabel diurutkan: Akan Dilaksanakan → Dalam Konfirmasi → Dibatalkan, lalu Tanggal Mulai, lalu Kode.
- Catatan highlight disimpan per minggu di NeonDB.
- Kunci admin opsional untuk melindungi upload serta perubahan catatan.
- Semua baris pada minggu terpilih ditampilkan dalam satu halaman.

## Arsitektur

```text
Browser
  ├─ GET /api/weeks
  ├─ GET /api/trainings?week_start=YYYY-MM-DD
  ├─ POST /api/upload
  └─ PUT/DELETE /api/notes/{week_start}
          ↓
FastAPI di Vercel
          ↓
Neon Postgres
```

Data pelatihan tidak lagi disimpan sebagai dataset utama di `localStorage`. Browser hanya menyimpan preferensi minggu yang terakhir dipilih. Dataset dan catatan highlight bersumber dari NeonDB.

## Struktur proyek

```text
dashboard-pelatihan/
├── app.py
├── database.py
├── requirements.txt
├── vercel.json
├── .env.example
├── sql/
│   └── 001_init.sql
├── static/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── tests/
    └── test_parser.py
```

## 1. Membuat tabel di Neon

Buka Neon Console, pilih project dan database, kemudian buka SQL Editor. Salin seluruh isi:

```text
sql/001_init.sql
```

Jalankan satu kali. Skrip tersebut membuat:

- `pelatihan` — data utama;
- `dashboard_meta` — informasi file terakhir;
- `pelatihan_week_notes` — catatan highlight per minggu;
- indeks tanggal dan status.

## 2. Mengambil connection string

Di Neon Console, klik **Connect** dan pilih connection string **pooled** untuk aplikasi. Simpan sebagai:

```text
DATABASE_URL
```

Contoh format:

```text
postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require&channel_binding=require
```

Jangan menulis nilai tersebut langsung di source code atau mengunggah `.env` ke GitHub.

## 3. Environment variables di Vercel

Buka:

```text
Vercel Project → Settings → Environment Variables
```

Tambahkan:

```text
DATABASE_URL=<pooled connection string Neon>
ADMIN_UPLOAD_KEY=<kunci panjang dan acak>
```

`ADMIN_UPLOAD_KEY` bersifat opsional, tetapi sangat disarankan. Bila diisi, pengguna harus memasukkan kunci tersebut saat upload atau menyimpan catatan. Kunci tidak disimpan permanen oleh aplikasi; browser menyimpannya sementara di `sessionStorage`.

Pilih environment yang diperlukan:

- Production;
- Preview;
- Development, bila digunakan.

Setelah mengubah environment variable, lakukan deployment baru atau redeploy.

## 4. Menjalankan lokal

Salin `.env.example` menjadi `.env`, lalu isi nilai sebenarnya.

### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DATABASE_URL="postgresql://..."
$env:ADMIN_UPLOAD_KEY="kunci-admin"
uvicorn app:app --reload
```

### macOS/Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL='postgresql://...'
export ADMIN_UPLOAD_KEY='kunci-admin'
uvicorn app:app --reload
```

Buka:

```text
http://127.0.0.1:8000
```

## 5. Deployment ke Vercel

Pastikan file berikut berada di root repository:

```text
app.py
database.py
requirements.txt
vercel.json
static/
sql/
```

Push ke branch Preview terlebih dahulu:

```bash
git checkout -b neon-dashboard
git add .
git commit -m "Hubungkan dashboard pelatihan ke NeonDB"
git push -u origin neon-dashboard
```

Periksa Preview Deployment. Setelah benar, merge ke `main`.

## Perilaku upload

Upload baru menjalankan proses berikut dalam satu transaksi database:

1. membaca dan menormalisasi file;
2. menghapus dataset pelatihan sebelumnya;
3. memasukkan seluruh baris dari file baru;
4. memperbarui metadata file terakhir;
5. commit.

Karena itu, file upload harus berisi **seluruh data yang ingin dipertahankan**, termasuk semua minggu. Bila file hanya berisi satu minggu, minggu lain akan hilang dari tabel `pelatihan`.

Catatan highlight tidak ikut dihapus ketika dataset diganti.

## API

### Daftar minggu

```http
GET /api/weeks
```

### Data satu minggu

```http
GET /api/trainings?week_start=2026-08-17
```

Tanpa `week_start`, endpoint mengembalikan seluruh data.

### Upload snapshot

```http
POST /api/upload
X-Admin-Key: <ADMIN_UPLOAD_KEY>
Content-Type: multipart/form-data
```

### Catatan highlight

```http
PUT /api/notes/2026-08-17
DELETE /api/notes/2026-08-17
```

### Pemeriksaan koneksi

```http
GET /api/health
```

Contoh hasil normal:

```json
{
  "status": "ok",
  "database_configured": true,
  "upload_protected": true,
  "database": "connected"
}
```

## Format kolom yang dikenali

| Kolom | Wajib | Keterangan |
|---|---:|---|
| Kode | Tidak | Kode atau ID pelatihan |
| Status | Tidak | Realisasi, Dalam Konfirmasi, Dibatalkan, dan variasinya |
| Jenis Pelatihan | Tidak | Contoh JFA atau SN-FA |
| Pembiayaan | Tidak | Contoh PNBP atau ABT |
| Lokasi | Tidak | Lokasi atau unit penyelenggara |
| Jumlah Kelas | Tidak | Bila kosong dianggap 1 |
| Judul Pelatihan | Ya | Nama pelatihan |
| Tanggal Mulai | Ya | Menentukan pengelompokan minggu |
| Akhir TM | Tidak | Tanggal akhir program |

Minggu menggunakan rentang Senin sampai Minggu.

## Troubleshooting

### `DATABASE_URL belum dikonfigurasi`

Tambahkan `DATABASE_URL` di Vercel lalu deploy ulang.

### `Tabel database belum dibuat`

Jalankan `sql/001_init.sql` di Neon SQL Editor.

### `Kunci admin tidak valid`

Pastikan nilai yang dimasukkan sama dengan `ADMIN_UPLOAD_KEY` pada environment deployment yang sedang dibuka.

### Preview kosong sedangkan Production berisi data

Periksa `DATABASE_URL` pada environment Preview. Bila menggunakan Neon Preview Branching, Preview dapat terhubung ke branch database yang berbeda dari Production.

### Upload menghapus minggu lain

Ini adalah perilaku snapshot. Gabungkan seluruh minggu ke satu file sebelum upload, atau ubah fungsi `replace_trainings()` menjadi mode upsert bila alur kerja Anda memakai file inkremental.


## Perubahan V5

- Judul dashboard: **GIA Corpu Weekly Training**.
- Tombol **Export PNG** berada di sidebar, di bawah Upload Data.
- Export PNG menangkap seluruh area dashboard termasuk seluruh tabel, tetapi **tidak menyertakan sidebar/toolbar kiri**.
- Grafik **Pelatihan per Lokasi** dan **Pelatihan per Jenis** dihitung berdasarkan **jumlah kelas**.
- Label `(kelas)` ditampilkan secara lebih soft pada judul grafik.
- Highlight **Kelas Terbanyak** menggunakan narasi, misalnya: `Pelatihan JFA mendominasi dengan 4 kelas.`
- html2canvas 1.4.1 dimuat dari cdnjs untuk proses export PNG di browser.
