# Patch V5.16 — MapLibre + OpenFreeMap

Patch ini mengganti visual peta SVG manual pada kartu **Sebaran Kelas Pelatihan** dengan basemap geografis sebenarnya memakai **MapLibre GL JS + OpenFreeMap**.

## Yang berubah
- Peta Indonesia menggunakan vector tiles OpenStreetMap/OpenFreeMap.
- Marker kelas tetap mengikuti daftar lokasi yang sudah dibuat aplikasi.
- `Pusdiklatwas` dipetakan ke Kab. Bogor.
- Lokasi virtual/PJJ tetap ditampilkan pada panel di luar peta oleh logika aplikasi lama.
- SVG lama tetap dipertahankan sebagai fallback jika layanan peta gagal dimuat.
- Tidak ada perubahan database, SQL, NeonDB, `app.py`, atau `database.py`.

## File patch
Replace/tambahkan:
- `static/index.html`
- `static/maplibre-location-map.css`
- `static/maplibre-location-map.js`

## Deploy
```bash
git add static/index.html static/maplibre-location-map.css static/maplibre-location-map.js
git commit -m "Update V5.16 - MapLibre Indonesia map"
git push origin main
```

## Catatan
Patch memuat MapLibre v6.15.0 dari UNPKG dan basemap OpenFreeMap `liberty`. Internet diperlukan pada browser pengguna untuk memuat tile peta.
