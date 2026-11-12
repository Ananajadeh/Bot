/**
 * Command: antivirtex
 * Mengaktifkan atau menonaktifkan fitur Anti-Virtex / Bug Text Crash di grup
 */

const { db } = require('../../lib/database');

module.exports = {
  name: 'antivirtex',
  aliases: ['virtex', 'antibug'],
  category: 'group',
  description: 'Mengaktifkan atau mematikan fitur Anti-Virtex / Bug Text di grup',
  usage: '<on / off>',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m, args, groupMetadata }) => {
    const action = (args[0] || '').toLowerCase();
    const group = db.getGroup(m.chat, groupMetadata?.subject);

    if (action === 'on' || action === 'enable' || action === '1' || action === 'aktif') {
      if (group.antivirtex) {
        return m.reply('ℹ️ Fitur *Anti-Virtex* sudah aktif di grup ini.');
      }
      group.antivirtex = true;
      db.save();
      return m.reply(
        '🛡️ *ANTI-VIRTEX BERHASIL DIAKTIFKAN!*\n\n' +
        'Bot akan otomatis mendeteksi pesan mencurigakan, payload berukuran abnormal, atau crash text, lalu menghapus pesan dan menendang (kick) pelakunya secara otomatis.'
      );
    } else if (action === 'off' || action === 'disable' || action === '0' || action === 'mati') {
      if (!group.antivirtex) {
        return m.reply('ℹ️ Fitur *Anti-Virtex* sudah dalam keadaan nonaktif.');
      }
      group.antivirtex = false;
      db.save();
      return m.reply('❌ *ANTI-VIRTEX TELAH DINONAKTIFKAN!*');
    } else {
      return m.reply(
        `⚙️ *PENGATURAN ANTI-VIRTEX*\n\n` +
        `• Status saat ini: *${group.antivirtex ? 'AKTIF (ON) ✅' : 'NONAKTIF (OFF) ❌'}*\n\n` +
        `Gunakan perintah:\n` +
        `• \`.antivirtex on\` (Untuk mengaktifkan)\n` +
        `• \`.antivirtex off\` (Untuk menonaktifkan)`
      );
    }
  }
};
