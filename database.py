from __future__ import annotations

import os
from contextlib import contextmanager
from datetime import date, datetime, timedelta, timezone
from typing import Any, Iterator

try:
    import psycopg
    from psycopg import Connection
    from psycopg.rows import dict_row
except ModuleNotFoundError:  # Allows parser-only tests before dependencies are installed.
    psycopg = None  # type: ignore[assignment]
    Connection = Any  # type: ignore[misc,assignment]
    dict_row = None


class DatabaseNotConfigured(RuntimeError):
    """Raised when DATABASE_URL is not available."""


class DatabaseDriverMissing(RuntimeError):
    """Raised when the psycopg dependency has not been installed."""


class DatabaseSchemaMissing(RuntimeError):
    """Raised when the required Neon tables have not been created."""


def database_url() -> str:
    value = os.getenv("DATABASE_URL", "").strip()
    if not value:
        raise DatabaseNotConfigured(
            "DATABASE_URL belum dikonfigurasi pada Vercel."
        )
    return value


@contextmanager
def connect_db() -> Iterator[Connection[Any]]:
    """Open a short transaction against Neon.

    DATABASE_URL should use Neon's pooled endpoint for the deployed app.
    The connection is always closed at the end of the request.
    """

    if psycopg is None:
        raise DatabaseDriverMissing(
            "Paket psycopg belum terpasang. Jalankan pip install -r requirements.txt."
        )

    try:
        with psycopg.connect(
            database_url(),
            row_factory=dict_row,
            connect_timeout=10,
        ) as connection:
            yield connection
    except Exception as exc:
        if isinstance(exc, psycopg.errors.UndefinedTable):
            raise DatabaseSchemaMissing(
                "Tabel database belum dibuat. Jalankan file sql/001_init.sql di Neon SQL Editor."
            ) from exc
        raise


def ping_database() -> None:
    with connect_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 AS ok")
            cursor.fetchone()


def get_meta(connection: Connection[Any] | None = None) -> dict[str, Any]:
    def _query(conn: Connection[Any]) -> dict[str, Any]:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT file_name, sheet_name, row_count, uploaded_at
                FROM dashboard_meta
                WHERE id = 1
                """
            )
            row = cursor.fetchone()
        if not row:
            return {
                "file_name": "",
                "sheet_name": "",
                "row_count": 0,
                "uploaded_at": None,
            }
        return dict(row)

    if connection is not None:
        return _query(connection)
    with connect_db() as conn:
        return _query(conn)


def list_weeks() -> tuple[list[dict[str, Any]], dict[str, Any]]:
    with connect_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    date_trunc('week', tanggal_mulai::timestamp)::date AS week_start,
                    (date_trunc('week', tanggal_mulai::timestamp)::date + 6) AS week_end,
                    COUNT(*)::int AS training_count,
                    COALESCE(SUM(jumlah_kelas), 0)::int AS class_count
                FROM pelatihan
                GROUP BY 1
                ORDER BY 1 DESC
                """
            )
            weeks = [dict(row) for row in cursor.fetchall()]
        meta = get_meta(connection)
    return weeks, meta


def get_week_note(connection: Connection[Any], week_start: date | None) -> str:
    if week_start is None:
        return ""
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT note FROM pelatihan_week_notes WHERE week_start = %s",
            (week_start,),
        )
        row = cursor.fetchone()
    return str(row["note"]) if row else ""


def fetch_trainings(
    week_start: date | None,
) -> tuple[list[dict[str, Any]], str, dict[str, Any]]:
    parameters: tuple[Any, ...]
    where_clause = ""
    if week_start is not None:
        where_clause = "WHERE tanggal_mulai >= %s AND tanggal_mulai < %s"
        parameters = (week_start, week_start + timedelta(days=7))
    else:
        parameters = ()

    query = f"""
        SELECT
            record_key AS id,
            kode,
            status_asli,
            status_kategori,
            jenis_pelatihan,
            pembiayaan,
            lokasi,
            jumlah_kelas,
            judul_pelatihan,
            tanggal_mulai,
            akhir_tm
        FROM pelatihan
        {where_clause}
        ORDER BY
            CASE status_kategori
                WHEN 'Akan Dilaksanakan' THEN 1
                WHEN 'Dalam Konfirmasi' THEN 2
                WHEN 'Dibatalkan' THEN 3
                ELSE 4
            END,
            tanggal_mulai,
            CASE WHEN kode ~ '^[0-9]+$' THEN kode::numeric END NULLS LAST,
            kode,
            judul_pelatihan
    """

    with connect_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, parameters)
            rows = [dict(row) for row in cursor.fetchall()]
        note = get_week_note(connection, week_start)
        meta = get_meta(connection)
    return rows, note, meta


def replace_trainings(
    rows: list[dict[str, Any]],
    *,
    file_name: str,
    sheet_name: str,
    uploaded_at: datetime | None = None,
) -> None:
    """Replace the central dataset atomically with one uploaded snapshot."""

    timestamp = uploaded_at or datetime.now(timezone.utc)
    insert_sql = """
        INSERT INTO pelatihan (
            record_key,
            kode,
            status_asli,
            status_kategori,
            jenis_pelatihan,
            pembiayaan,
            lokasi,
            jumlah_kelas,
            judul_pelatihan,
            tanggal_mulai,
            akhir_tm,
            source_file,
            imported_at
        ) VALUES (
            %(record_key)s,
            %(kode)s,
            %(status_asli)s,
            %(status_kategori)s,
            %(jenis_pelatihan)s,
            %(pembiayaan)s,
            %(lokasi)s,
            %(jumlah_kelas)s,
            %(judul_pelatihan)s,
            %(tanggal_mulai)s,
            %(akhir_tm)s,
            %(source_file)s,
            %(imported_at)s
        )
    """

    records = [
        {
            **row,
            "source_file": file_name,
            "imported_at": timestamp,
        }
        for row in rows
    ]

    with connect_db() as connection:
        with connection.cursor() as cursor:
            # Readers see either the old dataset or the new dataset because both
            # operations are committed in one transaction.
            cursor.execute("DELETE FROM pelatihan")
            cursor.executemany(insert_sql, records)
            cursor.execute(
                """
                INSERT INTO dashboard_meta (
                    id, file_name, sheet_name, row_count, uploaded_at
                ) VALUES (1, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    file_name = EXCLUDED.file_name,
                    sheet_name = EXCLUDED.sheet_name,
                    row_count = EXCLUDED.row_count,
                    uploaded_at = EXCLUDED.uploaded_at
                """,
                (file_name, sheet_name, len(rows), timestamp),
            )


def save_week_note(week_start: date, note: str) -> dict[str, Any]:
    cleaned = note.strip()[:500]
    with connect_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO pelatihan_week_notes (week_start, note, updated_at)
                VALUES (%s, %s, now())
                ON CONFLICT (week_start) DO UPDATE SET
                    note = EXCLUDED.note,
                    updated_at = now()
                RETURNING week_start, note, updated_at
                """,
                (week_start, cleaned),
            )
            row = cursor.fetchone()
    return dict(row) if row else {
        "week_start": week_start,
        "note": cleaned,
        "updated_at": datetime.now(timezone.utc),
    }


def delete_week_note(week_start: date) -> None:
    with connect_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM pelatihan_week_notes WHERE week_start = %s",
                (week_start,),
            )
