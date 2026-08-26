from __future__ import annotations

import os
import unittest
from datetime import date, datetime, timezone
from unittest.mock import patch

from fastapi.testclient import TestClient

from app import app


class ApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def tearDown(self) -> None:
        os.environ.pop("ADMIN_UPLOAD_KEY", None)

    @patch("app.list_weeks")
    def test_weeks_endpoint(self, mocked_list_weeks) -> None:
        mocked_list_weeks.return_value = (
            [
                {
                    "week_start": date(2026, 8, 17),
                    "week_end": date(2026, 8, 23),
                    "training_count": 7,
                    "class_count": 9,
                }
            ],
            {
                "file_name": "master.xlsx",
                "sheet_name": "Data",
                "row_count": 7,
                "uploaded_at": datetime(2026, 8, 19, tzinfo=timezone.utc),
            },
        )

        response = self.client.get("/api/weeks")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["weeks"][0]["week_start"], "2026-08-17")
        self.assertEqual(payload["weeks"][0]["class_count"], 9)

    @patch("app.fetch_trainings")
    def test_training_endpoint(self, mocked_fetch_trainings) -> None:
        mocked_fetch_trainings.return_value = (
            [
                {
                    "id": "abc",
                    "kode": "10",
                    "status_asli": "Realisasi",
                    "status_kategori": "Akan Dilaksanakan",
                    "jenis_pelatihan": "JFA",
                    "pembiayaan": "PNBP",
                    "lokasi": "PJJ",
                    "jumlah_kelas": 2,
                    "judul_pelatihan": "Pelatihan A",
                    "tanggal_mulai": date(2026, 8, 17),
                    "akhir_tm": None,
                }
            ],
            "Catatan minggu",
            {
                "file_name": "master.xlsx",
                "sheet_name": "Data",
                "row_count": 1,
                "uploaded_at": datetime(2026, 8, 19, tzinfo=timezone.utc),
            },
        )

        response = self.client.get("/api/trainings?week_start=2026-08-17")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["class_count"], 2)
        self.assertEqual(payload["week_end"], "2026-08-23")
        self.assertEqual(payload["note"], "Catatan minggu")

    @patch("app.replace_trainings")
    def test_upload_requires_key_and_persists_snapshot(self, mocked_replace) -> None:
        os.environ["ADMIN_UPLOAD_KEY"] = "rahasia"
        csv_data = (
            "Kode,Status,Judul Pelatihan,Tanggal Mulai,Jumlah Kelas\n"
            "10,Realisasi,Pelatihan A,20-Agu-2026,2\n"
        ).encode("utf-8")

        unauthorized = self.client.post(
            "/api/upload",
            files={"file": ("master.csv", csv_data, "text/csv")},
        )
        self.assertEqual(unauthorized.status_code, 401)

        response = self.client.post(
            "/api/upload",
            headers={"X-Admin-Key": "rahasia"},
            files={"file": ("master.csv", csv_data, "text/csv")},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["row_count"], 1)
        self.assertEqual(payload["class_count"], 2)
        self.assertEqual(payload["default_week"], "2026-08-17")
        mocked_replace.assert_called_once()


if __name__ == "__main__":
    unittest.main()
