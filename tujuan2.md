Saya ingin fitur baru: Kontribusi Developer di Aine API.

Fitur ini memungkinkan developer menambahkan endpoint mereka sendiri ke Aine API dengan alur:
Submit → Auto Test → Pending → Admin Approve → Publish.

Tolong implement:

1. Halaman kontribusi:



/kontribusi ada tombol Tambah Endpoint dan Cek Status

/submit form wizard 3 langkah:
a) Data developer (nama, github/kontak)
b) Detail endpoint (kategori, method, path, deskripsi, params)
c) Test endpoint lalu submit


2. Backend:



POST /api/submit → validasi + auto test endpoint, simpan sebagai submission

GET /api/submissions/:id → lihat status submission (TESTING / PENDING / APPROVED / REJECTED / FAILED_TEST)

Admin panel:

GET /admin/pending

POST /admin/approve/:id

POST /admin/reject/:id (dengan alasan)



3. Publish:



Jika approved, endpoint langsung muncul di docs explorer dan tampilkan:
"Dibuat oleh: {nama developer}"


4. Validasi wajib:



Path format: /api/<kategori>/<slug>

Tidak boleh duplicate

Anti SSRF (blok localhost/internal IP)

Timeout request max 10 detik

Rate limit untuk submit


Gunakan Bahasa Indonesia di UI dan respon API.