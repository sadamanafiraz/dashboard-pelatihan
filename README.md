# GIA Corpu Weekly Training — V5.8

Dashboard FastAPI + Neon Postgres untuk menyajikan pelatihan mingguan GIA Corpu. V5.8 mempertahankan UPSERT berdasarkan **Kode Diklat** dan menambahkan **Edit Data langsung dari dashboard**.

## Fitur utama V5.8

- Edit satu pelatihan langsung dari tabel melalui ikon pensil.
- `Kode Diklat` dikunci dan tetap menjadi business key unik.
- Perubahan disimpan langsung ke NeonDB melalui `PUT /api/trainings/{kode}`.
- Status berupa searchable dropdown: `Realisasi`, `Konfirmasi`, `Batal`, `Mundur`.
- Jenis Pelatihan berupa searchable dropdown: `JFA`, `SN-FA`, `TS Was`, `TS Manwas`.
- Pembiayaan berupa searchable dropdown: `Rupiah Murni`, `PNBP`, `STAR`, `ABT`.
- Lokasi berupa searchable dropdown: `Pusdiklatwas`, `Balai Medan`, `Balai Bali`, `Balai Makassar`, dan kota-kota di Indonesia.
- Jika Tanggal Mulai diubah ke minggu lain, data otomatis berpindah ke periode tersebut setelah dashboard dimuat ulang.
- Kolom Aksi tidak ikut dalam Export PNG.
- Edit, upload, dan catatan highlight menggunakan `ADMIN_UPLOAD_KEY` yang sama.

Fitur sebelumnya tetap dipertahankan: NeonDB, UPSERT upload Excel/CSV, pemilihan minggu, Export PNG HD, KPI kelas, grafik lokasi/jenis berdasarkan kelas, highlight mingguan, filter, pencarian, dan sorting status → tanggal → kode.

## Upgrade dari V5.6

V5.8 **tidak memerlukan migration SQL baru**. Pastikan database sudah menggunakan migration V5.6:

```text
sql/002_upsert_by_kode.sql
```

Jika migration tersebut sudah dijalankan, cukup ganti source code dan deploy ulang.

## Struktur proyek

```text
dashboard-pelatihan-vercel-v5-8/
├── app.py
├── database.py
├── requirements.txt
├── vercel.json
├── .env.example
├── sql/
│   ├── 000_preflight_v56.sql
│   ├── 001_init.sql
│   └── 002_upsert_by_kode.sql
├── static/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── tests/
```

## Environment variables

```text
DATABASE_URL=<Neon pooled connection string>
ADMIN_UPLOAD_KEY=<kunci admin>
```

Sangat disarankan `ADMIN_UPLOAD_KEY` selalu diisi di Vercel Production, karena kunci ini melindungi fitur Update Data, Edit Data, dan perubahan catatan highlight.

## Deploy ke GitHub/Vercel

Dari folder repository lokal:

```bash
git add .
git commit -m "Update dashboard V5.8 - direct edit"
git push origin main
```

Jika repository sudah terhubung ke Vercel, deployment Production akan berjalan otomatis.

## Endpoint utama

```text
GET  /api/weeks
GET  /api/trainings?week_start=YYYY-MM-DD
POST /api/upload
PUT  /api/trainings/{kode}
PUT  /api/notes/{week_start}
DELETE /api/notes/{week_start}
GET  /api/health
```

## Testing lokal

```bash
PYTHONPATH=. pytest -q
node --check static/app.js
```

Paket V5.8 telah diuji dengan 12 automated tests.
