-- Migration V5.5 -> V5.6
-- Tujuan: menjadikan Kode Diklat sebagai business key unik untuk proses UPSERT.
-- Script ini aman dijalankan ulang setelah migrasi berhasil.

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pelatihan
        WHERE kode IS NULL OR btrim(kode) = '' OR kode = '-'
    ) THEN
        RAISE EXCEPTION
            'Migrasi dihentikan: terdapat data dengan Kode kosong atau "-". Isi Kode Diklat yang valid terlebih dahulu.';
    END IF;

    IF EXISTS (
        SELECT kode
        FROM pelatihan
        GROUP BY kode
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Migrasi dihentikan: terdapat Kode Diklat duplikat. Pastikan satu Kode hanya memiliki satu record sebelum migrasi.';
    END IF;
END $$;

ALTER TABLE pelatihan
    ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE pelatihan
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE pelatihan
    ALTER COLUMN kode DROP DEFAULT;

CREATE UNIQUE INDEX IF NOT EXISTS pelatihan_kode_unique
    ON pelatihan (kode);

UPDATE pelatihan
SET created_at = COALESCE(imported_at, created_at),
    updated_at = COALESCE(imported_at, updated_at);

COMMIT;
