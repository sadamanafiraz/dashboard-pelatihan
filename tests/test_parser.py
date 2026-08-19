from __future__ import annotations

import unittest

import pandas as pd

from app import dataframe_to_rows, parse_date, prepare_dataframe


class ParserTests(unittest.TestCase):
    def test_indonesian_month_date(self) -> None:
        self.assertEqual(parse_date("20-Agu-2026"), "2026-08-20")
        self.assertEqual(parse_date("25-Des-2026"), "2026-12-25")

    def test_excel_serial_date(self) -> None:
        self.assertEqual(parse_date(46254), "2026-08-20")

    def test_header_detection_and_status_mapping(self) -> None:
        raw = pd.DataFrame(
            [
                ["Laporan Pelatihan", None, None, None],
                ["Kode", "Status", "Judul Pelatihan", "Tanggal Mulai"],
                [322, "Realisasi", "Penjenjangan Auditor", "20-Agu-2026"],
                [707, "Dibatalkan", "Pelatihan Batch 2", "21-Agu-2026"],
            ]
        )

        data, mapping = prepare_dataframe(raw)
        rows, warnings = dataframe_to_rows(data, mapping)

        self.assertEqual(warnings, [])
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["status_kategori"], "Akan Dilaksanakan")
        self.assertEqual(rows[1]["status_kategori"], "Dibatalkan")


if __name__ == "__main__":
    unittest.main()
