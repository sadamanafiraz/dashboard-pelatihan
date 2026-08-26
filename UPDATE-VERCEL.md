# Memperbarui Dashboard ke Versi NeonDB

## File yang berubah atau ditambahkan

```text
app.py
database.py
requirements.txt
static/index.html
static/styles.css
static/app.js
sql/001_init.sql
.env.example
README.md
UPDATE-VERCEL.md
```

## Urutan pembaruan

1. Cadangkan repository dan deployment Production saat ini.
2. Jalankan `sql/001_init.sql` di Neon SQL Editor.
3. Salin file versi NeonDB ke repository.
4. Tambahkan `DATABASE_URL` dan `ADMIN_UPLOAD_KEY` di Vercel.
5. Push ke branch baru agar Vercel membuat Preview Deployment.
6. Buka `/api/health` pada URL Preview.
7. Upload file master yang berisi seluruh minggu.
8. Uji pilihan minggu, KPI, grafik, tabel, dan catatan highlight.
9. Merge branch ke `main` setelah hasil benar.

## Perintah Git

```bash
git checkout -b neon-dashboard
git add .
git commit -m "Hubungkan dashboard pelatihan ke NeonDB"
git push -u origin neon-dashboard
```

Setelah Preview disetujui:

```bash
git checkout main
git merge neon-dashboard
git push origin main
```

## Peringatan penting

Endpoint upload menggunakan model **replace snapshot**. Setiap upload mengganti seluruh isi tabel `pelatihan`. Gunakan file master yang memuat semua minggu yang harus tersedia pada dashboard.
