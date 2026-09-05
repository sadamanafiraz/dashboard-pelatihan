# Update Vercel ke V5.8

Jika project V5.6/V5.5 sudah terhubung ke GitHub, cukup replace source code dengan V5.8 lalu push ke branch Production (`main`).

Environment Variables yang tetap dibutuhkan:

- `DATABASE_URL` — pooled connection string NeonDB
- `ADMIN_UPLOAD_KEY` — kunci untuk upload, edit data, dan catatan highlight

V5.8 tidak membutuhkan migration database baru di atas migration V5.6 (`002_upsert_by_kode.sql`).
