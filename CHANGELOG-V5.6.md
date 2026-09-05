# Changelog V5.6

- Mengubah upload dari replace-snapshot menjadi UPSERT.
- Menjadikan Kode Diklat sebagai business key unik.
- Menambahkan migration `002_upsert_by_kode.sql`.
- Menambahkan `created_at` dan `updated_at`.
- Menolak Kode duplikat dalam file upload.
- Melewati dan melaporkan baris dengan Kode kosong atau Tanggal Mulai tidak valid.
- Menambahkan statistik upload: inserted, updated, skipped, dan total database rows.
- Mengubah label tombol menjadi **Update Data**.
- Mempertahankan seluruh data historis yang tidak ada pada file upload terbaru.
