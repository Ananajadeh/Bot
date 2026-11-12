/**
 * Command: setprefix
 * Mengubah prefix perintah bot secara dinamis
 */

const config = require('../../config');

module.exports = {
  name: 'setprefix',
  aliases: ['prefix'],
  category: 'owner',
  description: 'Mengubah prefix perintah bot',
  usage: '<simbol prefix baru, contoh: . atau # atau !>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m, text }) => {
    if (!text) {
      return m.reply(`ℹ️ Prefix saat ini: *${config.prefix}*\nContoh ganti: \`.setprefix #\``);
    }

    const newPrefix = text.trim();
    config.prefix = newPrefix;

    await m.reply(`✅ *Prefix berhasil diubah!*\nPrefix baru yang aktif: *${newPrefix}*`);
  }
};
