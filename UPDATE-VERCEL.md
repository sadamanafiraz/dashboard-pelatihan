# Memperbarui Dashboard di Vercel — Versi 3

Versi ini berisi tiga penyesuaian lanjutan:

1. KPI **Total Kelas Pelatihan** menampilkan total kolom **Jumlah Kelas** sebagai angka utama dan jumlah judul pelatihan sebagai angka kecil.
2. KPI **Kelas Dalam Konfirmasi** dan **Kelas Dibatalkan** menampilkan jumlah kelas, bukan hanya jumlah baris pelatihan. Persentase kedua kartu dihitung terhadap total kelas.
3. Daftar pelatihan diurutkan otomatis dengan prioritas:
   - **Akan Dilaksanakan**;
   - **Dalam Konfirmasi**;
   - **Dibatalkan**;
   - di dalam status yang sama: **Tanggal Mulai** paling awal;
   - jika tanggal sama: **Kode** terkecil.

Kunci `localStorage` tetap sama, sehingga data upload dan catatan highlight pada browser Production yang sama tetap dapat digunakan setelah pembaruan.

## Cara paling aman melalui GitHub

1. Ekstrak paket patch versi 3.
2. Salin file berikut ke repository lama dan pilih **Replace**:
   - `static/index.html`
   - `static/styles.css`
   - `static/app.js`
   - `app.py`
   - `README.md`
   - `UPDATE-VERCEL.md`
3. Buat branch agar Vercel menghasilkan Preview Deployment:

```bash
git checkout -b pembaruan-dashboard-v3
git add .
git commit -m "Perbarui KPI kelas dan urutan tabel dashboard v3"
git push -u origin pembaruan-dashboard-v3
```

4. Uji URL Preview dari Vercel:
   - total kelas dan jumlah judul pelatihan;
   - jumlah kelas pada status konfirmasi dan dibatalkan;
   - urutan status, tanggal mulai, dan kode;
   - upload, filter, pencarian, serta catatan highlight.
5. Setelah hasilnya benar, merge branch ke `main`. Vercel akan memperbarui Production secara otomatis.

## Cara langsung ke Production

Setelah mengganti file pada repository lokal:

```bash
git add .
git commit -m "Perbarui KPI kelas dan urutan tabel dashboard v3"
git push origin main
```

## Catatan pengurutan

Tanggal Mulai diurutkan naik, sehingga tanggal yang lebih awal/terdekat pada periode terpilih tampil terlebih dahulu. Kode menggunakan pengurutan angka alami; sebagai contoh, kode `9` tampil sebelum `10`, bukan sesudahnya seperti pada pengurutan teks biasa.
