/**
 * CONFIGURATION FILE - nayxilaa md
 * Semua pengaturan bot WhatsApp berada di file ini.
 * Silakan sesuaikan nomor owner, nama bot, prefix, dll.
 */

module.exports = {
  // Nama Bot
  botName: 'nayxilaa md',

  // Nama Owner
  ownerName: 'AnanOFC',

  // Nomor Owner (Gunakan awalan 62 atau 08, otomatis dikonversi)
  // Termasuk ID LID WhatsApp Owner agar terdeteksi di semua versi WA
  ownerNumber: [
    '6283841800798',
    '083841800798',
    '42082559381518' // WhatsApp LID Owner
  ],

  // Prefix Perintah (Bisa string seperti '.' atau array seperti ['.', '#', '!'])
  prefix: '.',

  // Mode Bot: 'public' (bisa dipakai semua orang di grup & privat) atau 'self' (hanya owner)
  mode: 'public',

  // Fitur Koreksi Otomatis Typo Perintah (Rekomendasi perintah serupa saat salah ketik)
  commandCorrection: true,

  // Gunakan Pairing Code (true = pairing code, false = QR code terminal)
  pairingCode: true,

  // API Key Neoxr (https://api.neoxr.eu)
  neoxrApiKey: 'Anan270506',

  // Nomor bot default untuk pairing code
  botNumber: '6285124735602',

  // Folder Penyimpanan Sesi WhatsApp
  sessionDir: './session',

  // Pengaturan Limit & Akses Pengguna
  limitPremium: 50,
  limitFree: 5,
  resetLimitHour: 5, // 05:00 WIB
  privateOnlyPremium: true,

  // Pesan Respon Otomatis (Customizable)
  messages: {
    wait: '⏳ Sedang diproses, mohon tunggu sebentar...',
    success: '✅ Berhasil!',
    adminOnly: '⚠️ Perintah ini hanya dapat digunakan oleh *Admin Grup*!',
    botAdmin: '⚠️ Jadikan bot sebagai *Admin Grup* terlebih dahulu agar fitur ini berfungsi!',
    ownerOnly: '⚠️ Perintah ini khusus untuk *Owner Bot*!',
    groupOnly: '⚠️ Perintah ini hanya dapat digunakan di *Grup WhatsApp*!',
    privateOnly: '⚠️ Perintah ini hanya dapat digunakan di *Private Chat*!',
    error: '❌ Terjadi kesalahan saat menjalankan perintah.',
  },

  // Link Group Resmi Bot
  groupLink: 'https://chat.whatsapp.com/C8gTLRR2TvI9ytNso6X9YZ?s=cl&p=a&mlu=4&ilr=4&iam=2',

  // Foto Menu Bot (URL atau path lokal)
  menuImage: 'https://i.ibb.co.com/4nntsYnd/IMG-20261104-231353.jpg',

  // Footer Pesan Bot
  footer: 'nayxilaa md • WhatsApp Bot',
};
