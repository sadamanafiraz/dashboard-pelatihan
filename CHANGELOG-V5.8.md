# Changelog V5.8

- Menambahkan Edit Data langsung dari tabel dashboard.
- Kode Diklat dibuat read-only pada form edit.
- Menambahkan searchable dropdown untuk Status, Jenis Pelatihan, Pembiayaan, dan Lokasi.
- Status: Realisasi, Konfirmasi, Batal, Mundur.
- Jenis: JFA, SN-FA, TS Was, TS Manwas.
- Pembiayaan: Rupiah Murni, PNBP, STAR, ABT.
- Lokasi: unit utama GIA Corpu dan kota-kota di Indonesia.
- Menambahkan endpoint `PUT /api/trainings/{kode}` yang meng-update NeonDB berdasarkan Kode Diklat.
- Tanggal Mulai yang berubah ke minggu lain otomatis tercermin pada dropdown periode setelah refresh data.
- Menyembunyikan kolom Aksi dari Export PNG.
- Tidak ada perubahan schema database dari V5.6.
