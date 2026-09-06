# Patch V5.10

Patch ini ditujukan untuk dashboard V5.8 yang sudah memakai NeonDB dan migration V5.6.

## File yang diganti

Salin/replace file berikut ke repository GitHub:

- `app.py`
- `database.py`
- `static/index.html`
- `static/styles.css`
- `static/app.js`
- `tests/test_api.py`

Tambahan dokumentasi:

- `CHANGELOG-V5.10.md`

## Database

Tidak ada SQL migration baru. Pastikan `sql/002_upsert_by_kode.sql` dari V5.6 sudah pernah dijalankan.

## Deploy

Setelah replace file:

```bash
git add .
git commit -m "Update dashboard V5.10 - partial edit and delete by kode"
git push origin main
```

Vercel akan redeploy otomatis bila repository sudah terhubung.
