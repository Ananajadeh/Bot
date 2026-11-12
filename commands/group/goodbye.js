/**
 * Command: goodbye
 * Mengaktifkan atau menonaktifkan pesan perpisahan anggota keluar (Goodbye Member)
 */

const { db } = require('../../lib/database');

module.exports = {
  name: 'goodbye',
  aliases: ['goodbyemember', 'leave', 'left'],
  category: 'group',
  description: 'Mengaktifkan atau mematikan pesan perpisahan anggota keluar',
  usage: '<on / off>',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m, args, groupMetadata }) => {
    const action = (args[0] || '').toLowerCase();
    const group = db.getGroup(m.chat, groupMetadata?.subject);

    if (action === 'on' || action === 'enable' || action === '1' || action === 'aktif') {
      if (group.goodbye) {
        return m.reply('ℹ️ Fitur *Goodbye Member* sudah aktif di grup ini.');
      }
      group.goodbye = true;
      db.save();
      return m.reply(
        '👋 *GOODBYE MEMBER BERHASIL DIAKTIFKAN!*\n\n' +
        'Bot akan otomatis mengirimkan pesan perpisahan setiap ada anggota yang keluar atau dikeluarkan dari grup.'
      );
    } else if (action === 'off' || action === 'disable' || action === '0' || action === 'mati') {
      if (!group.goodbye) {
        return m.reply('ℹ️ Fitur *Goodbye Member* sudah dalam keadaan nonaktif.');
      }
      group.goodbye = false;
      db.save();
      return m.reply('❌ *GOODBYE MEMBER TELAH DINONAKTIFKAN!*');
    } else {
      return m.reply(
        `⚙️ *PENGATURAN GOODBYE MEMBER*\n\n` +
        `• Status saat ini: *${group.goodbye ? 'AKTIF (ON) ✅' : 'NONAKTIF (OFF) ❌'}*\n\n` +
        `Gunakan perintah:\n` +
        `• \`.goodbye on\` (Untuk mengaktifkan)\n` +
        `• \`.goodbye off\` (Untuk menonaktifkan)`
      );
    }
  }
};
