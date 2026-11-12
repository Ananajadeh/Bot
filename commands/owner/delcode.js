/**
 * Command: delcode
 * Menghapus file command secara aman disertai backup otomatis.
 */

const config = require('../../config');
const { deleteCommandSafely } = require('../../lib/autoCoder');

module.exports = {
  name: 'delcode',
  aliases: ['rmcode', 'hapusfitur', 'deletecode'],
  category: 'owner',
  description: 'Menghapus file command bot dengan backup otomatis',
  usage: '<nama_command / path_file>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m, text }) => {
    if (!text) {
      return m.reply(
        `⚠️ Masukkan nama command atau path file yang ingin dihapus!\n` +
        `Contoh: \`${config.prefix}delcode gempa\` atau \`${config.prefix}delcode commands/tools/gempa.js\``
      );
    }

    await m.react('⏳');
    const result = deleteCommandSafely(text.trim());

    if (result.success) {
      await m.react('✅');
      await m.reply(`🗑️ *PENGHAPUSAN BERHASIL!*\n\n${result.message}`);
    } else {
      await m.react('❌');
      await m.reply(`❌ *Gagal menghapus:*\n${result.message}`);
    }
  }
};
