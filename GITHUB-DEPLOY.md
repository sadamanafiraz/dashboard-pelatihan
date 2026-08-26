# Update GitHub dan Vercel — V5

## Cara paling sederhana

1. Ekstrak ZIP V5.
2. Salin seluruh isi folder ke repository GitHub dashboard yang sekarang.
3. Replace file lama jika diminta.
4. Pastikan Environment Variables Vercel tetap tersedia:
   - `DATABASE_URL`
   - `ADMIN_UPLOAD_KEY`
5. Commit dan push ke branch `main`.
6. Vercel akan melakukan redeploy otomatis jika repository sudah terhubung.

Contoh Git:

```bash
git add .
git commit -m "Update dashboard pelatihan V5"
git push origin main
```

## File utama yang berubah dari V4

- `app.py`
- `static/index.html`
- `static/styles.css`
- `static/app.js`
- `README.md`
- `CHANGELOG-V5.md`

Database schema Neon tidak berubah, sehingga `sql/001_init.sql` tidak perlu dijalankan ulang jika V4 sudah berjalan normal.

## Catatan Export PNG

Fitur Export PNG menggunakan `html2canvas` 1.4.1 dari cdnjs. Browser pengguna perlu dapat mengakses cdnjs saat halaman dimuat. Bila library gagal dimuat, dashboard tetap berfungsi, tetapi tombol Export PNG akan menampilkan pesan error.
