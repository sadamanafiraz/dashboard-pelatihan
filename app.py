from __future__ import annotations

import re
import unicodedata
from datetime import date, datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
MAX_FILE_BYTES = 4 * 1024 * 1024
ALLOWED_SUFFIXES = {".xlsx", ".xls", ".csv"}

app = FastAPI(
    title="Dashboard Pelatihan Minggu Depan",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url=None,
)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


COLUMN_ALIASES: dict[str, set[str]] = {
    "kode": {"kode", "kodepelatihan", "id", "nomor", "no"},
    "status_asli": {"status", "statuspelatihan", "keteranganstatus"},
    "jenis_pelatihan": {
        "jenispelatihan",
        "jenis",
        "kategori",
        "kelompokpelatihan",
    },
    "pembiayaan": {"pembiayaan", "sumberpembiayaan", "anggaran"},
    "lokasi": {"lokasi", "tempat", "unitkerja", "penyelenggara"},
    "jumlah_kelas": {"jumlahkelas", "jmlkelas", "kelas", "jumlah"},
    "judul_pelatihan": {
        "judulpelatihan",
        "judul",
        "namapelatihan",
        "namadiklat",
        "pelatihan",
    },
    "tanggal_mulai": {
        "tanggalmulai",
        "tglmulai",
        "mulai",
        "startdate",
        "tanggalpelaksanaan",
    },
    "akhir_tm": {
        "akhirtm",
        "tanggalakhir",
        "tglakhir",
        "akhir",
        "enddate",
        "selesai",
    },
}

REQUIRED_COLUMNS = {"judul_pelatihan", "tanggal_mulai"}
ALL_ALIASES = set().union(*COLUMN_ALIASES.values())

INDONESIAN_MONTHS = {
    "januari": "January",
    "jan": "Jan",
    "februari": "February",
    "feb": "Feb",
    "maret": "March",
    "mar": "Mar",
    "april": "April",
    "apr": "Apr",
    "mei": "May",
    "juni": "June",
    "jun": "Jun",
    "juli": "July",
    "jul": "Jul",
    "agustus": "August",
    "agu": "Aug",
    "agt": "Aug",
    "september": "September",
    "sep": "Sep",
    "oktober": "October",
    "okt": "Oct",
    "november": "November",
    "nov": "Nov",
    "desember": "December",
    "des": "Dec",
}


def normalize_key(value: Any) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    text = unicodedata.normalize("NFKD", str(value))
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", "", text.lower()).strip()


def clean_text(value: Any) -> str:
    if value is None or pd.isna(value):
        return ""
    if isinstance(value, bool):
        return "Ya" if value else "Tidak"
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def make_unique_headers(headers: list[Any]) -> list[str]:
    seen: dict[str, int] = {}
    output: list[str] = []
    for index, raw_header in enumerate(headers, start=1):
        header = clean_text(raw_header) or f"Kolom {index}"
        count = seen.get(header, 0) + 1
        seen[header] = count
        output.append(header if count == 1 else f"{header} ({count})")
    return output


def detect_header_row(raw_df: pd.DataFrame) -> int:
    best_index = 0
    best_score = -1
    limit = min(len(raw_df), 20)

    for row_index in range(limit):
        values = [normalize_key(value) for value in raw_df.iloc[row_index].tolist()]
        non_empty = sum(bool(value) for value in values)
        matched = sum(value in ALL_ALIASES for value in values)
        score = (matched * 20) + non_empty
        if score > best_score:
            best_index = row_index
            best_score = score

    return best_index


def read_csv(content: bytes) -> tuple[pd.DataFrame, str]:
    last_error: Exception | None = None
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            frame = pd.read_csv(
                BytesIO(content),
                header=None,
                sep=None,
                engine="python",
                dtype=object,
                encoding=encoding,
            )
            return frame, "CSV"
        except Exception as exc:  # pragma: no cover - fallback path
            last_error = exc
    raise ValueError(f"CSV tidak dapat dibaca: {last_error}")


def read_excel(content: bytes, suffix: str) -> tuple[pd.DataFrame, str]:
    engine = "openpyxl" if suffix == ".xlsx" else "xlrd"
    try:
        workbook = pd.ExcelFile(BytesIO(content), engine=engine)
    except ImportError as exc:
        if suffix == ".xls":
            raise ValueError(
                "Format .xls memerlukan paket xlrd. Jalankan pip install -r requirements.txt."
            ) from exc
        raise

    for sheet_name in workbook.sheet_names:
        frame = workbook.parse(sheet_name=sheet_name, header=None, dtype=object)
        frame = frame.dropna(how="all")
        if not frame.empty:
            return frame, sheet_name

    raise ValueError("Workbook tidak memiliki lembar kerja yang berisi data.")


def read_uploaded_table(content: bytes, suffix: str) -> tuple[pd.DataFrame, str]:
    if suffix == ".csv":
        return read_csv(content)
    return read_excel(content, suffix)


def map_columns(columns: list[str]) -> dict[str, str]:
    normalized_to_original: dict[str, str] = {}
    for column in columns:
        normalized = normalize_key(column)
        if normalized and normalized not in normalized_to_original:
            normalized_to_original[normalized] = column

    mapping: dict[str, str] = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in normalized_to_original:
                mapping[canonical] = normalized_to_original[alias]
                break
    return mapping


def replace_indonesian_months(text: str) -> str:
    result = text
    for indonesia, english in sorted(
        INDONESIAN_MONTHS.items(), key=lambda item: len(item[0]), reverse=True
    ):
        result = re.sub(
            rf"(?<![A-Za-z]){re.escape(indonesia)}(?![A-Za-z])",
            english,
            result,
            flags=re.IGNORECASE,
        )
    return result


def parse_date(value: Any) -> str | None:
    if value is None or pd.isna(value):
        return None

    if isinstance(value, pd.Timestamp):
        return value.date().isoformat()
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        number = float(value)
        if 1 <= number <= 80000:
            parsed = date(1899, 12, 30) + timedelta(days=int(number))
            return parsed.isoformat()

    text = clean_text(value)
    if not text:
        return None

    if re.fullmatch(r"\d+(?:\.0+)?", text):
        number = float(text)
        if 1 <= number <= 80000:
            parsed = date(1899, 12, 30) + timedelta(days=int(number))
            return parsed.isoformat()

    translated = replace_indonesian_months(text)
    parsed = pd.to_datetime(translated, dayfirst=True, errors="coerce")
    if pd.isna(parsed):
        return None
    return parsed.date().isoformat()


def parse_positive_integer(value: Any, default: int = 1) -> int:
    if value is None or pd.isna(value):
        return default
    try:
        number = int(float(str(value).replace(",", ".")))
        return number if number > 0 else default
    except (TypeError, ValueError):
        return default


def normalize_status(value: Any) -> str:
    status = normalize_key(value)
    if any(token in status for token in ("batal", "cancel")):
        return "Dibatalkan"
    if any(
        token in status
        for token in ("konfirmasi", "pending", "proses", "tentatif", "menunggu")
    ):
        return "Dalam Konfirmasi"
    return "Akan Dilaksanakan"


def prepare_dataframe(raw_df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, str]]:
    raw_df = raw_df.dropna(how="all").reset_index(drop=True)
    if raw_df.empty:
        raise ValueError("File tidak memiliki data.")

    header_index = detect_header_row(raw_df)
    headers = make_unique_headers(raw_df.iloc[header_index].tolist())
    data = raw_df.iloc[header_index + 1 :].copy()
    data.columns = headers
    data = data.dropna(how="all").reset_index(drop=True)

    mapping = map_columns(list(data.columns))
    missing = REQUIRED_COLUMNS - set(mapping)
    if missing:
        readable = {
            "judul_pelatihan": "Judul Pelatihan",
            "tanggal_mulai": "Tanggal Mulai",
        }
        missing_names = ", ".join(readable[column] for column in sorted(missing))
        raise ValueError(
            f"Kolom wajib tidak ditemukan: {missing_names}. "
            "Periksa nama kolom pada file yang diunggah."
        )

    return data, mapping


def get_value(row: pd.Series, mapping: dict[str, str], canonical: str) -> Any:
    column = mapping.get(canonical)
    return row[column] if column else None


def dataframe_to_rows(
    data: pd.DataFrame, mapping: dict[str, str]
) -> tuple[list[dict[str, Any]], list[str]]:
    rows: list[dict[str, Any]] = []
    invalid_date_count = 0

    for position, (_, source_row) in enumerate(data.iterrows(), start=1):
        start_date = parse_date(get_value(source_row, mapping, "tanggal_mulai"))
        if not start_date:
            invalid_date_count += 1
            continue

        original_status = clean_text(get_value(source_row, mapping, "status_asli"))
        rows.append(
            {
                "id": f"row-{position}",
                "kode": clean_text(get_value(source_row, mapping, "kode")) or "-",
                "status_asli": original_status or "-",
                "status_kategori": normalize_status(original_status),
                "jenis_pelatihan": clean_text(
                    get_value(source_row, mapping, "jenis_pelatihan")
                )
                or "Lainnya",
                "pembiayaan": clean_text(
                    get_value(source_row, mapping, "pembiayaan")
                )
                or "-",
                "lokasi": clean_text(get_value(source_row, mapping, "lokasi"))
                or "Belum ditentukan",
                "jumlah_kelas": parse_positive_integer(
                    get_value(source_row, mapping, "jumlah_kelas")
                ),
                "judul_pelatihan": clean_text(
                    get_value(source_row, mapping, "judul_pelatihan")
                )
                or "Tanpa judul",
                "tanggal_mulai": start_date,
                "akhir_tm": parse_date(get_value(source_row, mapping, "akhir_tm")),
            }
        )

    warnings: list[str] = []
    if invalid_date_count:
        warnings.append(
            f"{invalid_date_count} baris dilewati karena Tanggal Mulai tidak valid."
        )
    if not rows:
        raise ValueError("Tidak ada baris dengan Tanggal Mulai yang valid.")

    rows.sort(key=lambda item: (item["tanggal_mulai"], item["judul_pelatihan"]))
    return rows, warnings


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/upload")
async def upload_training_data(file: UploadFile = File(...)) -> dict[str, Any]:
    filename = Path(file.filename or "data").name
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(
            status_code=400,
            detail="Format file harus .xlsx, .xls, atau .csv.",
        )

    content = await file.read(MAX_FILE_BYTES + 1)
    await file.close()

    if not content:
        raise HTTPException(status_code=400, detail="File kosong.")
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Ukuran file melebihi batas 4 MB pada deployment Vercel.",
        )

    try:
        raw_df, sheet_name = read_uploaded_table(content, suffix)
        data, mapping = prepare_dataframe(raw_df)
        rows, warnings = dataframe_to_rows(data, mapping)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive API boundary
        raise HTTPException(
            status_code=400,
            detail=f"File tidak dapat diproses: {exc}",
        ) from exc

    return {
        "file_name": filename,
        "sheet_name": sheet_name,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "row_count": len(rows),
        "warnings": warnings,
        "rows": rows,
    }
