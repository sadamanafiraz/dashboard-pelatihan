# Patch V5.14 - Peta Sebaran Kelas Pelatihan

Patch ini mengganti visual **Pelatihan per Lokasi** dari donut chart menjadi **peta Indonesia**.

## File yang diganti
Salin dan replace tiga file berikut ke repository aplikasi yang sedang aktif:

- `static/index.html`
- `static/app.js`
- `static/styles.css`

Tidak ada perubahan database, NeonDB, environment variable, atau SQL migration.

## Perilaku lokasi
- `Pusdiklatwas` -> `Kab. Bogor`
- `Balai Medan` -> `Medan`
- `Balai Bali` / `Balai Denpasar` -> `Denpasar`
- `Balai Makassar` -> `Makassar`
- `Balai Yogyakarta` -> `Yogyakarta`
- `Balai Balikpapan` -> `Balikpapan`
- Kota Indonesia yang dikenali -> titik kota masing-masing
- `PJJ`, `Virtual`, `Lainnya`, lokasi kosong, atau lokasi yang tidak dikenali -> panel **Lokasi Lainnya / Tidak Spesifik** di bawah peta

## Deploy
Setelah replace file:

```bash
git add static/index.html static/app.js static/styles.css
git commit -m "Update V5.14 - peta sebaran kelas pelatihan"
git push origin main
```

Vercel akan melakukan deploy otomatis jika repository sudah terhubung.

## Catatan
Peta dibuat sebagai SVG lokal agar tetap tajam pada fitur Export PNG dan tidak memerlukan API peta eksternal.
