# GIA Corpu Weekly Training — V5.6

Dashboard FastAPI + Neon Postgres untuk menyajikan pelatihan mingguan secara terpusat. V5.6 mengubah mekanisme upload menjadi **UPSERT berdasarkan Kode Diklat** sehingga data minggu lama tidak lagi dihapus ketika file baru diunggah.

## Perubahan utama V5.6

- `Kode` wajib dan menjadi **business key unik**.
- Kode baru → **INSERT** data baru.
- Kode yang sudah ada → **UPDATE** seluruh informasi selain Kode dan waktu pertama dibuat.
- Data yang tidak ada di file terbaru → **tetap tersimpan** di NeonDB.
- File dengan Kode duplikat → **ditolak** sebelum menyentuh database.
- Baris dengan Kode kosong atau Tanggal Mulai tidak valid → dilewati dan dilaporkan.
- Hasil upload menampilkan jumlah data baru, diperbarui, dilewati, dan total record database.
- Dropdown minggu tetap dibentuk otomatis dari `Tanggal Mulai` seluruh data di NeonDB.
- Tombol UI berubah menjadi **Update Data**.

Fitur V5.5 tetap dipertahankan: Export PNG HD tanpa sidebar, grafik jumlah kelas, highlight mingguan, sorting status/tanggal/kode, filter, pencarian, dan tampilan seluruh tabel dalam satu halaman.

## Struktur proyek

```text
dashboard-pelatihan-vercel-v5-6/
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

## Upgrade dari V5.5

### 1. Backup NeonDB

Sebelum migrasi, buat branch/backup database Neon bila diperlukan.

### 2. Cek kesiapan data

Jalankan isi:

```text
sql/000_preflight_v56.sql
```

Hasil ideal: kedua query tidak mengembalikan baris. Jika ada Kode kosong atau Kode duplikat, rapikan data tersebut terlebih dahulu.

### 3. Jalankan migration

Di Neon SQL Editor jalankan:

```text
sql/002_upsert_by_kode.sql
```

Migration akan:

- menambahkan `created_at`;
- menambahkan `updated_at`;
- menghapus default `'-'` pada `kode`;
- membuat unique index `pelatihan_kode_unique`.

Untuk database baru, cukup jalankan `sql/001_init.sql`.

### 4. Push source code ke GitHub

```bash
git add .
git commit -m "Update dashboard to V5.6 upsert by Kode Diklat"
git push origin main
```

Jika repository terhubung ke Vercel, deployment baru akan dibuat otomatis.

## Perilaku Update Data

Contoh database sebelum upload:

```text
101 | Pelatihan A | 31 Agu
102 | Pelatihan B | 01 Sep
103 | Pelatihan C | 02 Sep
```

File baru:

```text
102 | Pelatihan B revisi | 08 Sep
104 | Pelatihan D        | 09 Sep
```

Hasil database:

```text
101 | tetap
102 | diperbarui
103 | tetap
104 | ditambahkan
```

Tidak ada `DELETE FROM pelatihan` pada proses upload V5.6.

## Aturan Kode Diklat

- Kolom `Kode` wajib ada pada file.
- Nilai Kode tidak boleh kosong atau `-`.
- Satu file tidak boleh memiliki Kode yang sama lebih dari satu kali.
- Kode disimpan sebagai `TEXT`, sehingga nilai seperti `JFA-101` tetap didukung.
- Sebaiknya Kode di Excel disimpan sebagai teks jika memiliki leading zero, misalnya `00123`.

## Response API upload

`POST /api/upload` sekarang mengembalikan ringkasan seperti:

```json
{
  "processed_count": 23,
  "inserted_count": 18,
  "updated_count": 4,
  "skipped_count": 1,
  "total_database_rows": 146
}
```

## Environment variables

```text
DATABASE_URL=<Neon pooled connection string>
ADMIN_UPLOAD_KEY=<kunci admin>
```

## Pemeriksaan deployment

Buka:

```text
/api/health
```

Jika migration V5.6 belum dijalankan, health endpoint akan memberi pesan agar menjalankan `sql/002_upsert_by_kode.sql`.

## Testing lokal

```bash
python -m pytest -q
```

V5.6 memiliki pengujian parser, API, validasi Kode, duplikasi Kode, dan ringkasan UPSERT.
