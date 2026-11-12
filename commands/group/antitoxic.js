/**
 * Command: antitoxic
 * Mengaktifkan atau menonaktifkan fitur Anti-Toxic / Anti-Kata Kasar di grup
 */

const { db } = require('../../lib/database');

module.exports = {
  name: 'antitoxic',
  aliases: ['antikatakasar', 'toxic'],
  category: 'group',
  description: 'Mengaktifkan atau mematikan fitur Anti-Toxic / Anti-Kata Kasar di grup',
  usage: '<on / off>',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m, args, groupMetadata }) => {
    const action = (args[0] || '').toLowerCase();
    const group = db.getGroup(m.chat, groupMetadata?.subject);

    if (action === 'on' || action === 'enable' || action === '1' || action === 'aktif') {
      if (group.antitoxic) {
        return m.reply('ℹ️ Fitur *Anti-Toxic* sudah aktif di grup ini.');
      }
      group.antitoxic = true;
      db.save();
      return m.reply(
        '✅ *ANTI-TOXIC BERHASIL DIAKTIFKAN!*\n\n' +
        'Setiap pesan member yang mengandung kata kasar / umpatan / toxic akan otomatis dihapus oleh bot (jika bot menjadi Admin).'
      );
    } else if (action === 'off' || action === 'disable' || action === '0' || action === 'mati') {
      if (!group.antitoxic) {
        return m.reply('ℹ️ Fitur *Anti-Toxic* sudah dalam keadaan nonaktif.');
      }
      group.antitoxic = false;
      db.save();
      return m.reply('❌ *ANTI-TOXIC TELAH DINONAKTIFKAN!*');
    } else {
      return m.reply(
        `⚙️ *PENGATURAN ANTI-TOXIC*\n\n` +
        `• Status saat ini: *${group.antitoxic ? 'AKTIF (ON) ✅' : 'NONAKTIF (OFF) ❌'}*\n\n` +
        `Gunakan perintah:\n` +
        `• \`.antitoxic on\` (Untuk mengaktifkan)\n` +
        `• \`.antitoxic off\` (Untuk menonaktifkan)`
      );
    }
  }
};
