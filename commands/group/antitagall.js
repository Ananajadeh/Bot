/**
 * Command: antitagall
 * Mengaktifkan atau menonaktifkan fitur Anti-Tagall / Mass Mention di grup
 */

const { db } = require('../../lib/database');

module.exports = {
  name: 'antitagall',
  aliases: ['antimention'],
  category: 'group',
  description: 'Mengaktifkan atau mematikan fitur Anti-Tagall di grup',
  usage: '<on / off>',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m, args, groupMetadata }) => {
    const action = (args[0] || '').toLowerCase();
    const group = db.getGroup(m.chat, groupMetadata?.subject);

    if (action === 'on' || action === 'enable' || action === '1' || action === 'aktif') {
      if (group.antitagall) {
        return m.reply('ℹ️ Fitur *Anti-Tagall* sudah aktif di grup ini.');
      }
      group.antitagall = true;
      db.save();
      return m.reply(
        '🛡️ *ANTI-TAGALL BERHASIL DIAKTIFKAN!*\n\n' +
        'Member biasa yang melakukan mass mention (tag banyak member sekaligus) akan otomatis ditegur dan pesannya dihapus oleh bot.'
      );
    } else if (action === 'off' || action === 'disable' || action === '0' || action === 'mati') {
      if (!group.antitagall) {
        return m.reply('ℹ️ Fitur *Anti-Tagall* sudah dalam keadaan nonaktif.');
      }
      group.antitagall = false;
      db.save();
      return m.reply('❌ *ANTI-TAGALL TELAH DINONAKTIFKAN!*');
    } else {
      return m.reply(
        `⚙️ *PENGATURAN ANTI-TAGALL*\n\n` +
        `• Status saat ini: *${group.antitagall ? 'AKTIF (ON) ✅' : 'NONAKTIF (OFF) ❌'}*\n\n` +
        `Gunakan perintah:\n` +
        `• \`.antitagall on\` (Untuk mengaktifkan)\n` +
        `• \`.antitagall off\` (Untuk menonaktifkan)`
      );
    }
  }
};
