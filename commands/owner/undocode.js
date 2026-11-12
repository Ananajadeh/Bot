/**
 * Command: undocode
 * Membatalkan (revert / rollback) perubahan atau pembuatan file terakhir oleh Auto Coder.
 */

const { rollbackLast } = require('../../lib/autoCoder');

module.exports = {
  name: 'undocode',
  aliases: ['rollbackcode', 'revertcode', 'undo'],
  category: 'owner',
  description: 'Rollback / kembalikan perubahan terakhir dari Auto Coder',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m }) => {
    await m.react('⏳');
    const result = rollbackLast();

    if (result.success) {
      await m.react('✅');
      await m.reply(`⏪ *ROLLBACK BERHASIL!*\n\n${result.message}`);
    } else {
      await m.react('❌');
      await m.reply(`⚠️ *Rollback Gagal:*\n${result.message}`);
    }
  }
};
