# ABSENSI SD NEGERI KIUPUNU — V3

V3 memperbarui V2 dengan:
- Dashboard baru
- Data guru/siswa + pencarian
- Pendaftaran wajah yang mempertahankan descriptor saat edit
- Absensi kamera + liveness sederhana
- Absensi manual lengkap
- Absensi hari ini
- Rekap harian/mingguan/bulanan/tahunan
- Export Excel
- Pengaturan jam masuk dan mulai terlambat
- Manajemen pengguna
- Audit log
- Struktur JSON tetap dipakai agar kompatibel dengan proyek V2

## Menjalankan
```bash
npm install
npm start
```
Buka `http://localhost:3000`.

Untuk produksi, ubah `JWT_SECRET` dan password akun demo.
Kamera memerlukan HTTPS ketika digunakan dari domain publik.
