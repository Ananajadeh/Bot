/**
 * Command: leave
 * Mengeluarkan bot dari grup saat ini
 */

const { db } = require('../../lib/database');

module.exports = {
  name: 'leave',
  aliases: ['out', 'keluar'],
  category: 'owner',
  description: 'Mengeluarkan bot dari grup ini',
  usage: '',
  groupOnly: true,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ sock, m }) => {
    // Hapus status sewa jika ada
    db.delSewa(m.chat);

    await m.reply('👋 Selamat tinggal semua! Bot pamit keluar dari grup atas instruksi Owner.');
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await sock.groupLeave(m.chat);
    } catch (err) {
      await m.reply(`❌ Gagal keluar grup: ${err.message}`);
    }
  }
};
