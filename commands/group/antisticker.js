/**
 * Command: antisticker
 * Mengaktifkan atau menonaktifkan fitur Anti-Sticker Spam di grup
 */

const { db } = require('../../lib/database');

module.exports = {
  name: 'antisticker',
  aliases: ['antistickerspam', 'antispamsticker'],
  category: 'group',
  description: 'Mengaktifkan atau mematikan fitur Anti-Sticker Spam di grup',
  usage: '<on / off>',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m, args, groupMetadata }) => {
    const action = (args[0] || '').toLowerCase();
    const group = db.getGroup(m.chat, groupMetadata?.subject);

    if (action === 'on' || action === 'enable' || action === '1' || action === 'aktif') {
      if (group.antistickerspam) {
        return m.reply('ℹ️ Fitur *Anti-Sticker Spam* sudah aktif di grup ini.');
      }
      group.antistickerspam = true;
      db.save();
      return m.reply(
        '🛡️ *ANTI-STICKER SPAM BERHASIL DIAKTIFKAN!*\n\n' +
        'Member biasa yang mengirimkan stiker secara beruntun / membanjiri chat akan otomatis dicegah dan stikernya dihapus oleh bot.'
      );
    } else if (action === 'off' || action === 'disable' || action === '0' || action === 'mati') {
      if (!group.antistickerspam) {
        return m.reply('ℹ️ Fitur *Anti-Sticker Spam* sudah dalam keadaan nonaktif.');
      }
      group.antistickerspam = false;
      db.save();
      return m.reply('❌ *ANTI-STICKER SPAM TELAH DINONAKTIFKAN!*');
    } else {
      return m.reply(
        `⚙️ *PENGATURAN ANTI-STICKER SPAM*\n\n` +
        `• Status saat ini: *${group.antistickerspam ? 'AKTIF (ON) ✅' : 'NONAKTIF (OFF) ❌'}*\n\n` +
        `Gunakan perintah:\n` +
        `• \`.antisticker on\` (Untuk mengaktifkan)\n` +
        `• \`.antisticker off\` (Untuk menonaktifkan)`
      );
    }
  }
};
