/**
 * Command: setdesc
 * Mengubah deskripsi info grup WhatsApp
 */

module.exports = {
  name: 'setdesc',
  aliases: ['setdeskripsi', 'setdescription'],
  category: 'group',
  description: 'Mengubah deskripsi grup WhatsApp',
  usage: '<deskripsi baru>',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: true,
  ownerOnly: false,

  execute: async ({ sock, m, text }) => {
    if (!text) {
      return m.reply('⚠️ Masukkan deskripsi grup yang baru!\nContoh: `.setdesc Selamat datang di grup resmi nayxilaa md.`');
    }

    try {
      await sock.groupUpdateDescription(m.chat, text);
      await m.reply('✅ Deskripsi grup berhasil diperbarui!');
    } catch (err) {
      await m.reply(`❌ Gagal mengubah deskripsi grup: ${err.message}`);
    }
  }
};
