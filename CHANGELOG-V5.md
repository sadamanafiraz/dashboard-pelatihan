# Changelog V5

## UI
- Judul utama menjadi **GIA Corpu Weekly Training**.
- Tombol **Export PNG** ditambahkan di sidebar di bawah Upload Data.
- Sidebar tidak ikut diekspor ke PNG.

## Perhitungan
- Grafik lokasi dihitung berdasarkan jumlah kelas.
- Grafik jenis pelatihan dihitung berdasarkan jumlah kelas.
- Highlight jenis terbanyak menjadi **Kelas Terbanyak**.
- Narasi highlight: `Pelatihan <jenis> mendominasi dengan <jumlah> kelas.`

## Export PNG
- Seluruh `.main-content` ditangkap sampai tabel baris terakhir.
- Modal, toast, backdrop, dan sidebar tidak ikut pada gambar.
- Nama file mengikuti minggu terpilih: `dashboard-pelatihan-YYYY-MM-DD.png`.
