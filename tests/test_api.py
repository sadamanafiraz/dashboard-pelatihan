from __future__ import annotations

import os
import unittest
from datetime import date, datetime, timezone
from unittest.mock import patch

from fastapi.testclient import TestClient

from app import app


CURRENT_ROW = {
    "id": "abc",
    "kode": "744",
    "status_asli": "Realisasi",
    "status_kategori": "Akan Dilaksanakan",
    "jenis_pelatihan": "JFA",
    "pembiayaan": "PNBP",
    "lokasi": "Pusdiklatwas",
    "jumlah_kelas": 2,
    "judul_pelatihan": "Pelatihan A",
    "tanggal_mulai": date(2026, 9, 7),
    "akhir_tm": date(2026, 9, 11),
}


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
        self.assertEqual(response.json()["weeks"][0]["class_count"], 9)

    @patch("app.fetch_trainings")
    def test_training_endpoint(self, mocked_fetch_trainings) -> None:
        mocked_fetch_trainings.return_value = (
            [CURRENT_ROW],
            "Catatan minggu",
            {
                "file_name": "master.xlsx",
                "sheet_name": "Data",
                "row_count": 1,
                "uploaded_at": datetime(2026, 8, 19, tzinfo=timezone.utc),
            },
        )
        response = self.client.get("/api/trainings?week_start=2026-09-07")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["class_count"], 2)

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
            "11,Konfirmasi,Pelatihan B,21-Agu-2026,1\n"
        ).encode("utf-8")
        unauthorized = self.client.post(
            "/api/upload", files={"file": ("master.csv", csv_data, "text/csv")}
        )
        self.assertEqual(unauthorized.status_code, 401)
        response = self.client.post(
            "/api/upload",
            headers={"X-Admin-Key": "rahasia"},
            files={"file": ("master.csv", csv_data, "text/csv")},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["inserted_count"], 1)
        self.assertEqual(response.json()["updated_count"], 1)

    @patch("app.update_training")
    @patch("app.fetch_training_by_code")
    def test_partial_edit_updates_only_changed_field(self, mocked_fetch, mocked_update) -> None:
        os.environ["ADMIN_UPLOAD_KEY"] = "rahasia"
        mocked_fetch.return_value = CURRENT_ROW
        mocked_update.return_value = {**CURRENT_ROW, "lokasi": "Balai Bali"}

        unauthorized = self.client.patch("/api/trainings/744", json={"lokasi": "Balai Bali"})
        self.assertEqual(unauthorized.status_code, 401)

        response = self.client.patch(
            "/api/trainings/744",
            headers={"X-Admin-Key": "rahasia"},
            json={"lokasi": "Balai Bali"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["changed_fields"], ["lokasi"])
        args, _ = mocked_update.call_args
        self.assertEqual(args[0], "744")
        self.assertEqual(args[1], {"lokasi": "Balai Bali"})

    @patch("app.update_training")
    @patch("app.fetch_training_by_code")
    def test_partial_edit_can_clear_optional_field(self, mocked_fetch, mocked_update) -> None:
        mocked_fetch.return_value = CURRENT_ROW
        mocked_update.return_value = {**CURRENT_ROW, "lokasi": None}
        response = self.client.patch("/api/trainings/744", json={"lokasi": None})
        self.assertEqual(response.status_code, 200)
        args, _ = mocked_update.call_args
        self.assertIsNone(args[1]["lokasi"])

    @patch("app.update_training")
    @patch("app.fetch_training_by_code")
    def test_partial_edit_status_recalculates_category(self, mocked_fetch, mocked_update) -> None:
        mocked_fetch.return_value = CURRENT_ROW
        mocked_update.return_value = {
            **CURRENT_ROW,
            "status_asli": "Batal",
            "status_kategori": "Dibatalkan",
        }
        response = self.client.patch("/api/trainings/744", json={"status_asli": "Batal"})
        self.assertEqual(response.status_code, 200)
        args, _ = mocked_update.call_args
        self.assertEqual(args[1]["status_kategori"], "Dibatalkan")

    @patch("app.update_training")
    @patch("app.fetch_training_by_code")
    def test_partial_edit_rejects_invalid_location_when_touched(self, mocked_fetch, mocked_update) -> None:
        mocked_fetch.return_value = CURRENT_ROW
        response = self.client.patch("/api/trainings/744", json={"lokasi": "Lokasi Bebas"})
        self.assertEqual(response.status_code, 422)
        mocked_update.assert_not_called()

    @patch("app.update_training")
    @patch("app.fetch_training_by_code")
    def test_partial_edit_rejects_end_before_existing_start(self, mocked_fetch, mocked_update) -> None:
        mocked_fetch.return_value = CURRENT_ROW
        response = self.client.patch("/api/trainings/744", json={"akhir_tm": "2026-09-06"})
        self.assertEqual(response.status_code, 422)
        mocked_update.assert_not_called()

    @patch("app.delete_training")
    def test_delete_training_requires_key_and_deletes_by_code(self, mocked_delete) -> None:
        os.environ["ADMIN_UPLOAD_KEY"] = "rahasia"
        mocked_delete.return_value = {
            "kode": "744",
            "judul_pelatihan": "Pelatihan A",
            "total_database_rows": 11,
        }
        unauthorized = self.client.delete("/api/trainings/744")
        self.assertEqual(unauthorized.status_code, 401)

        response = self.client.delete(
            "/api/trainings/744",
            headers={"X-Admin-Key": "rahasia"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["deleted_kode"], "744")
        self.assertEqual(response.json()["total_database_rows"], 11)
        mocked_delete.assert_called_once()

    @patch("app.upsert_trainings")
    def test_upload_rejects_duplicate_codes_before_database(self, mocked_upsert) -> None:
        csv_data = (
            "Kode,Status,Judul Pelatihan,Tanggal Mulai\n"
            "10,Realisasi,Pelatihan A,20-Agu-2026\n"
            "10,Realisasi,Pelatihan B,21-Agu-2026\n"
        ).encode("utf-8")
        response = self.client.post(
            "/api/upload", files={"file": ("duplicate.csv", csv_data, "text/csv")}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Kode Diklat duplikat", response.json()["detail"])
        mocked_upsert.assert_not_called()


if __name__ == "__main__":
    unittest.main()
