-- Jalankan ini bila ingin memeriksa kesiapan database sebelum migration V5.6.

SELECT kode, COUNT(*) AS jumlah
FROM pelatihan
GROUP BY kode
HAVING COUNT(*) > 1
ORDER BY jumlah DESC, kode;

SELECT record_key, kode, judul_pelatihan, tanggal_mulai
FROM pelatihan
WHERE kode IS NULL OR btrim(kode) = '' OR kode = '-';
