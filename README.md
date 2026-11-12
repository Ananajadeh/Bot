# 🤖 nayxilaa md - WhatsApp Multi-Device Bot

Bot WhatsApp modular berbasis Node.js menggunakan library **`@whiskeysockets/baileys`** dengan sistem otentikasi **Pairing Code** (tanpa perlu repot scan QR). Dilengkapi fitur AI pintar & gaul, sistem sewa bot grup, member premium, sistem limit harian dengan reset otomatis pukul 05:00 WIB, downloader multimedia, dan manajemen grup lengkap.

---

## 📋 Fitur yang Tersedia

### 🤖 Fitur Chat AI (Neoxr API)
| Perintah | Deskripsi |
| :--- | :--- |
| `.ai <pertanyaan>` / `.bard` / `.chat` | Ngobrol dengan AI ramah, santai, gaul, friendly, sesekali memaki santai bersensor (`anjink`, `bjir`, `bgsd`) dan memuji user |

---

### 📥 Fitur Downloader (Neoxr API)
| Perintah | Deskripsi |
| :--- | :--- |
| `.tiktok <url>` / `.tt` | Download video TikTok tanpa watermark atau slide foto |
| `.instagram <url>` / `.ig` | Download Reels, Video, atau Foto Instagram (Auto video/image detection) |
| `.ytmp3 <url>` / `.yta` | Download audio lagu YouTube format MP3 (128kbps) |
| `.ytmp4 <url>` / `.ytv` | Download video YouTube format MP4 (360p) |
| `.play <judul lagu>` | Cari lagu di YouTube dan kirim audionya secara instan |

---

### 🎨 Fitur Maker & Stiker (Neoxr API)
| Perintah | Deskripsi |
| :--- | :--- |
| `.sticker` / `.s` / `.stiker` | Konversi foto, video (< 7 detik), atau GIF menjadi Stiker WhatsApp |
| `.brat <teks>` / `.brattext` | Buat stiker teks gaya album Brat (Charli XCX) |
| `.bratvid <teks>` / `.bratvideo` | Buat stiker animasi atau video teks berjalan kata demi kata gaya Brat |

---

### 👑 Fitur Khusus Owner, Auto-Coding, Sewa Bot & Member Premium
| Perintah | Deskripsi |
| :--- | :--- |
| `.autocode <permintaan>` / `.acode` | **Fitur Auto-Coding AI (Neoxr):** Menambah, mengedit, dan memodifikasi fitur bot secara otomatis via chat WhatsApp dengan validasi sintaks & hot-reload |
| `.undocode` / `.undo` | Membatalkan / rollback perubahan kode terakhir yang dilakukan oleh Auto Coder |
| `.readcode <nama/path>` | Melihat isi kode file command bot langsung dari chat |
| `.listcode` / `.files` | Melihat daftar seluruh file kode command dan ukurannya |
| `.delcode <nama/path>` | Menghapus file command bot secara aman dengan backup |
| `.reloadcode` / `.reload` | Memuat ulang seluruh file command ke memori bot tanpa perlu restart |
| `.addsewa <hari> <link_grup>` | Menyewakan bot ke grup WhatsApp melalui link undangan atau di dalam grup |
| `.delsewa [jid_grup]` | Menghapus status sewa grup |
| `.listsewa` | Melihat daftar seluruh grup yang sedang menyewa bot dan sisa waktu aktifnya |
| `.addprem <hari> <nomor>` | Menambahkan status Member Premium (+50 limit/hari & akses private chat) |
| `.delprem <nomor>` | Mencabut status member premium (limit kembali 5/hari) |
| `.listprem` | Melihat daftar seluruh member premium aktif dan masa kedaluwarsanya |
| `.botgroup <on/off>` | Mengatur mode Bot Only Group (hanya merespon di grup) |
| `.setlimit <nomor> <jumlah>` | Mengatur jumlah limit user secara manual oleh Owner |
| `.resetlimit` | Memaksa reset limit harian seluruh user secara instan |
| `> <code>` atau `.eval <code>` | Menjalankan kode JavaScript langsung (Live Evaluation) |
| `$ <cmd>` atau `.exec <cmd>` | Menjalankan perintah terminal Linux (Shell Execution) |
| `.mode <public/self>` | Mengubah mode akses bot (Semua orang atau hanya Owner) |
| `.setprefix <prefix>` | Mengubah simbol prefix perintah secara instan |
| `.bc <pesan>` | Broadcast / siaran pesan ke seluruh grup yang diikuti bot |
| `.join <link_grup>` | Memasukkan bot ke grup melalui link undangan |
| `.leave` | Mengeluarkan bot dari grup aktif |
| `.block <@user/reply/nomor>` | Memblokir kontak pengguna di WhatsApp |
| `.unblock <@user/reply/nomor>` | Membuka blokir kontak pengguna |
| `.restart` | Memulai ulang sistem bot |

---

### 👥 Fitur Admin Grup
| Perintah | Deskripsi |
| :--- | :--- |
| `.delete` / `.del` | Menghapus pesan di grup (pesan bot atau pesan orang lain jika bot admin) |
| `.infogroup` / `.groupinfo` | Menampilkan detail lengkap informasi, statistik, dan status sewa grup |
| `.warn <@user/reply> [alasan]` | Memberi peringatan ke member grup (3x pelanggaran = otomatis di-kick) |
| `.unwarn <@user/reply>` | Mengurangi / mencabut poin peringatan member grup |
| `.listwarn` | Melihat daftar seluruh member yang memiliki peringatan di grup |
| `.mute` / `.tutup` | Menutup grup agar hanya Admin yang dapat berkirim pesan |
| `.unmute` / `.buka` | Membuka kembali grup agar semua member dapat berkirim pesan |
| `.kick <@user/reply/nomor>` | Mengeluarkan member dari grup |
| `.add <nomor>` | Menambahkan member baru ke dalam grup |
| `.promote <@user/reply>` | Menaikkan jabatan member menjadi Admin grup |
| `.demote <@user/reply>` | Menurunkan jabatan Admin menjadi member biasa |
| `.hidetag <pesan>` | Mention semua member grup secara tersembunyi |
| `.tagall [pesan]` | Mention semua member dengan format list bernomor |
| `.group <open/close>` | Membuka / menutup grup (hanya admin yang dapat chat) |
| `.linkgroup` | Mengambil tautan link undangan grup |
| `.revokelink` | Mereset link undangan grup lama & membuat link baru |
| `.setname <nama_baru>` | Mengubah nama/subjek grup |
| `.setdesc <deskripsi_baru>` | Mengubah deskripsi info grup |
| `.ceksewa` | Mengecek status dan sisa waktu sewa bot di grup aktif |

---

### 🌐 Fitur Umum & Akun Pengguna
| Perintah | Deskripsi |
| :--- | :--- |
| `.menu` / `.help` | Menampilkan seluruh menu perintah yang tersedia beserta status limit |
| `.limit` / `.me` / `.cekprem` | Melihat profil pengguna, sisa limit harian, dan masa aktif premium |
| `.ping` / `.speed` | Menguji kecepatan latensi respon bot dalam milidetik (ms) |
| `.runtime` / `.uptime` | Mengecek berapa lama bot sudah aktif berjalan |
| `.owner` | Mengirim kontak resmi Owner bot dalam bentuk vCard |

---

## 🔍 Fitur Koreksi Otomatis Typo Perintah (Auto-Correction)
Bot dilengkapi sistem deteksi typo cerdas berbasis algoritma *Damerau-Levenshtein Distance* & *Jaro-Winkler Similarity*.
- Jika pengguna salah mengetik perintah (misal: `.cipcit`), bot secara otomatis mendeteksi kemiripan teks dan merekomendasikan perintah yang benar (misal: `.capcut`).
- Rekomendasi dilengkapi deskripsi fitur sehingga pengguna langsung memahami fungsinya.
- Typo tidak mengurangi poin limit harian pengguna.

---

## 🎟️ Sistem Limit Harian & Akses Private Chat
1. **Aturan Private Chat:**
   - Bot di *Private Chat* khusus diperuntukkan bagi **Member Premium** dan **Owner**.
   - Member reguler (free) diarahkan menggunakan bot di dalam grup WhatsApp.
2. **Kapasitas Limit Harian:**
   - **Member Reguler (Free):** Mendapatkan **5 limit harian**.
   - **Member Premium:** Mendapatkan **50 limit harian**.
   - **Owner:** **Unlimited (Tanpa Batas)**.
3. **Reset Limit Pukul 05:00 WIB:**
   - Limit pengguna otomatis di-reset setiap hari tepat pada pukul **05:00 WIB**.
   - Sinkronisasi cycle harian tersimpan aman di database JSON sehingga tahan restart sistem.
