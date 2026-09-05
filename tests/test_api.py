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

    @patch("app.upsert_trainings")
    def test_upload_requires_key_and_returns_upsert_summary(self, mocked_upsert) -> None:
        os.environ["ADMIN_UPLOAD_KEY"] = "rahasia"
        mocked_upsert.return_value = {
            "inserted_count": 1,
            "updated_count": 1,
            "total_database_rows": 12,
        }
        csv_data = (
            "Kode,Status,Judul Pelatihan,Tanggal Mulai,Jumlah Kelas\n"
            "10,Realisasi,Pelatihan A,20-Agu-2026,2\n"
            "11,Dalam Konfirmasi,Pelatihan B,21-Agu-2026,1\n"
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
        self.assertEqual(payload["processed_count"], 2)
        self.assertEqual(payload["inserted_count"], 1)
        self.assertEqual(payload["updated_count"], 1)
        self.assertEqual(payload["skipped_count"], 0)
        self.assertEqual(payload["total_database_rows"], 12)
        self.assertEqual(payload["class_count"], 3)
        self.assertEqual(payload["default_week"], "2026-08-17")
        mocked_upsert.assert_called_once()

    @patch("app.update_training")
    def test_direct_edit_requires_admin_key_and_updates_by_code(self, mocked_update) -> None:
        os.environ["ADMIN_UPLOAD_KEY"] = "rahasia"
        mocked_update.return_value = {
            "id": "abc",
            "kode": "744",
            "status_asli": "Konfirmasi",
            "status_kategori": "Dalam Konfirmasi",
            "jenis_pelatihan": "JFA",
            "pembiayaan": "PNBP",
            "lokasi": "Pusdiklatwas",
            "jumlah_kelas": 2,
            "judul_pelatihan": "Pelatihan A",
            "tanggal_mulai": date(2026, 9, 7),
            "akhir_tm": date(2026, 9, 11),
        }
        payload = {
            "status_asli": "Konfirmasi",
            "jenis_pelatihan": "JFA",
            "pembiayaan": "PNBP",
            "lokasi": "Pusdiklatwas",
            "jumlah_kelas": 2,
            "judul_pelatihan": "Pelatihan A",
            "tanggal_mulai": "2026-09-07",
            "akhir_tm": "2026-09-11",
        }

        unauthorized = self.client.put("/api/trainings/744", json=payload)
        self.assertEqual(unauthorized.status_code, 401)

        response = self.client.put(
            "/api/trainings/744",
            headers={"X-Admin-Key": "rahasia"},
            json=payload,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["row"]["status_kategori"], "Dalam Konfirmasi")
        args, kwargs = mocked_update.call_args
        self.assertEqual(args[0], "744")
        self.assertEqual(args[1]["status_kategori"], "Dalam Konfirmasi")

    @patch("app.update_training")
    def test_direct_edit_rejects_location_outside_dropdown(self, mocked_update) -> None:
        payload = {
            "status_asli": "Realisasi",
            "jenis_pelatihan": "JFA",
            "pembiayaan": "Rupiah Murni",
            "lokasi": "Lokasi Bebas",
            "jumlah_kelas": 1,
            "judul_pelatihan": "Pelatihan A",
            "tanggal_mulai": "2026-09-07",
            "akhir_tm": None,
        }
        response = self.client.put("/api/trainings/744", json=payload)
        self.assertEqual(response.status_code, 422)
        mocked_update.assert_not_called()

    @patch("app.upsert_trainings")
    def test_upload_rejects_duplicate_codes_before_database(self, mocked_upsert) -> None:
        csv_data = (
            "Kode,Status,Judul Pelatihan,Tanggal Mulai\n"
            "10,Realisasi,Pelatihan A,20-Agu-2026\n"
            "10,Realisasi,Pelatihan B,21-Agu-2026\n"
        ).encode("utf-8")

        response = self.client.post(
            "/api/upload",
            files={"file": ("duplicate.csv", csv_data, "text/csv")},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Kode Diklat duplikat", response.json()["detail"])
        mocked_upsert.assert_not_called()


if __name__ == "__main__":
    unittest.main()
