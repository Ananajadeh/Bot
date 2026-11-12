/**
 * Command: reloadcode
 * Memuat ulang (hot-reload) seluruh file command dari disk ke memori bot tanpa perlu restart proses.
 */

const { loadCommands, getAllCommands, getCategories } = require('../../lib/loader');

module.exports = {
  name: 'reloadcode',
  aliases: ['reload', 'refresh'],
  category: 'owner',
  description: 'Memuat ulang seluruh command ke memori bot',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m }) => {
    await m.react('⏳');
    try {
      loadCommands();
      const all = getAllCommands();
      const cats = getCategories();

      await m.react('✅');
      await m.reply(
        `🔄 *RELOAD BERHASIL!*\n\n` +
        `• Total Perintah Dimuat: *${all.length} command*\n` +
        `• Kategori Tersedia: *${cats.length} kategori* (${cats.join(', ')})\n\n` +
        `_Seluruh perubahan kode terbaru telah aktif di memori bot._`
      );
    } catch (err) {
      await m.react('❌');
      await m.reply(`❌ *Gagal reload:* ${err.message}`);
    }
  }
};
