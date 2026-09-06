# V5.10 — Partial Edit & Hapus per Kode Diklat

Perubahan dari V5.8:

- Menu Edit menjadi **partial update** (`PATCH`): hanya kolom yang benar-benar diubah yang ditulis ke NeonDB.
- Kolom lain tetap sama dan tidak perlu dipilih/diisi ulang.
- Field opsional **Jenis Pelatihan, Pembiayaan, Lokasi, dan Akhir TM** dapat dikosongkan dari menu Edit.
- Field inti **Status, Jumlah Kelas, Judul Pelatihan, dan Tanggal Mulai** tidak dapat dikosongkan.
- Ditambahkan indikator **Diubah** dan jumlah perubahan sebelum simpan.
- Ditambahkan **Hapus Diklat** per Kode Diklat dengan dialog konfirmasi kedua.
- Penghapusan dan edit tetap dilindungi `ADMIN_UPLOAD_KEY`.
- Setelah edit/hapus, daftar minggu, KPI, grafik, dan tabel dimuat ulang dari NeonDB.
- Tidak memerlukan migration SQL baru jika schema V5.6 (`002_upsert_by_kode.sql`) sudah diterapkan.
