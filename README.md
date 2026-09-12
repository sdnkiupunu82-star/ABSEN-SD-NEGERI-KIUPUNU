# ABSENSI SD NEGERI KIUPUNU — V2

Identitas:
- Nama: ABSENSI SD NEGERI KIUPUNU
- Alamat: Jl. Pelajar
- Kecamatan: Bikomo Selatan
- Kabupaten: Timor Tengah Utara
- Provinsi: Nusa Tenggara Timur
- Pembuat: Odi Funan

## V2 yang ditambahkan
1. Login aman menggunakan bcrypt + JWT.
2. Tiga role: Admin, Guru Piket, Guru.
3. Admin dapat tambah/edit/hapus guru dan siswa.
4. Admin mendaftarkan wajah guru/siswa.
5. Kamera melakukan deteksi wajah dan membuat face descriptor 128 angka.
6. Absensi kamera otomatis mencocokkan descriptor dengan data yang terdaftar.
7. Ada verifikasi gerakan kepala sederhana sebagai liveness challenge.
8. Cegah absen dua kali pada tanggal yang sama.
9. Status otomatis Hadir/Terlambat berdasarkan jam server.
10. Rekap harian, mingguan, bulanan, tahunan, dan kustom.
11. Rekap per guru/siswa dan per kelas.
12. Export Excel dengan kop sekolah, kolom rapi, autofilter dan frozen header.
13. Dashboard dengan grafik 7 hari.
14. Hak akses menu sesuai role.
15. Responsive untuk HP dan laptop.

## Login demo
Admin: admin / admin123
Guru Piket: piket / piket123
Guru: guru / guru123

## Menjalankan
Node.js 18+:
npm install
npm start
Buka http://localhost:3000

## Kamera
Kamera memerlukan izin browser. Pada deployment online gunakan HTTPS.
Model face-api.js dimuat dari jsdelivr CDN.

## Catatan produksi yang sangat penting
Versi V2 ini cocok sebagai project starter/ujicoba. Untuk sekolah sungguhan, sebaiknya:
- Pindahkan database JSON ke PostgreSQL.
- Gunakan password admin/guru yang unik dan ganti semua akun demo.
- Set JWT_SECRET yang panjang dan rahasia.
- Tambahkan audit log.
- Enkripsi/kelola descriptor wajah dengan perlindungan yang sesuai.
- Tambahkan kebijakan privasi dan persetujuan penggunaan biometrik.
- Uji akurasi kamera pada perangkat dan kondisi cahaya sekolah.
- Liveness saat ini masih sederhana (gerakan kepala dua frame), bukan sistem anti-spoofing biometrik tingkat tinggi.
- Tentukan kebijakan penghapusan data wajah dan absensi.

## Railway
Project bisa di-push ke GitHub lalu di-deploy ke Railway.
Start command: npm start
Set environment variable JWT_SECRET di Railway.
Untuk produksi, gunakan PostgreSQL Railway dan migrasikan data dari database.json.
