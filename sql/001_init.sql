BEGIN;

CREATE TABLE IF NOT EXISTS pelatihan (
    record_key text PRIMARY KEY,
    kode text NOT NULL DEFAULT '-',
    status_asli text NOT NULL DEFAULT '-',
    status_kategori text NOT NULL
        CHECK (status_kategori IN (
            'Akan Dilaksanakan',
            'Dalam Konfirmasi',
            'Dibatalkan'
        )),
    jenis_pelatihan text NOT NULL DEFAULT 'Lainnya',
    pembiayaan text NOT NULL DEFAULT '-',
    lokasi text NOT NULL DEFAULT 'Belum ditentukan',
    jumlah_kelas integer NOT NULL DEFAULT 1 CHECK (jumlah_kelas > 0),
    judul_pelatihan text NOT NULL,
    tanggal_mulai date NOT NULL,
    akhir_tm date,
    source_file text NOT NULL DEFAULT '',
    imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pelatihan_tanggal_mulai_idx
    ON pelatihan (tanggal_mulai);

CREATE INDEX IF NOT EXISTS pelatihan_status_tanggal_idx
    ON pelatihan (status_kategori, tanggal_mulai, kode);

CREATE TABLE IF NOT EXISTS dashboard_meta (
    id smallint PRIMARY KEY CHECK (id = 1),
    file_name text NOT NULL DEFAULT '',
    sheet_name text NOT NULL DEFAULT '',
    row_count integer NOT NULL DEFAULT 0 CHECK (row_count >= 0),
    uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pelatihan_week_notes (
    week_start date PRIMARY KEY,
    note varchar(500) NOT NULL DEFAULT '',
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
