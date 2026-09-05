# Update V5.5 → V5.6 di NeonDB + Vercel

1. Backup/branch database Neon Production.
2. Jalankan `sql/000_preflight_v56.sql`.
3. Pastikan tidak ada Kode kosong/`-` dan tidak ada Kode duplikat.
4. Jalankan `sql/002_upsert_by_kode.sql`.
5. Replace source code repository dengan V5.6.
6. Commit dan push ke GitHub.
7. Tunggu deployment Vercel selesai.
8. Buka `/api/health`; pastikan `status: ok` dan `database: connected`.
9. Uji **Update Data** dengan file kecil yang berisi:
   - satu Kode lama dengan informasi yang diubah;
   - satu Kode baru.
10. Pastikan Kode lama ter-update, Kode baru bertambah, dan data lain tetap ada.

## Perintah Git

```bash
git add .
git commit -m "Update dashboard V5.6 - upsert by Kode Diklat"
git push origin main
```
