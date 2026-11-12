/**
 * Command: setname
 * Mengubah nama/subjek grup WhatsApp
 */

module.exports = {
  name: 'setname',
  aliases: ['setsubject', 'gantinama', 'setnama'],
  category: 'group',
  description: 'Mengubah nama grup WhatsApp',
  usage: '<nama baru>',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: true,
  ownerOnly: false,

  execute: async ({ sock, m, text }) => {
    if (!text) {
      return m.reply('⚠️ Masukkan nama grup yang baru!\nContoh: `.setname Komunitas Pecinta Bot`');
    }

    if (text.length > 100) {
      return m.reply('❌ Nama grup maksimal 100 karakter!');
    }

    try {
      await sock.groupUpdateSubject(m.chat, text);
      await m.reply(`✅ Nama grup berhasil diubah menjadi:\n*${text}*`);
    } catch (err) {
      await m.reply(`❌ Gagal mengubah nama grup: ${err.message}`);
    }
  }
};
