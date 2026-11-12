/**
 * Command: welcome
 * Mengaktifkan atau menonaktifkan pesan sambutan member baru (Welcome Member)
 */

const { db } = require('../../lib/database');

module.exports = {
  name: 'welcome',
  aliases: ['welcomemember'],
  category: 'group',
  description: 'Mengaktifkan atau mematikan pesan sambutan anggota baru',
  usage: '<on / off>',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m, args, groupMetadata }) => {
    const action = (args[0] || '').toLowerCase();
    const group = db.getGroup(m.chat, groupMetadata?.subject);

    if (action === 'on' || action === 'enable' || action === '1' || action === 'aktif') {
      if (group.welcome) {
        return m.reply('ℹ️ Fitur *Welcome Member* sudah aktif di grup ini.');
      }
      group.welcome = true;
      db.save();
      return m.reply(
        '👋 *WELCOME MEMBER BERHASIL DIAKTIFKAN!*\n\n' +
        'Bot akan otomatis menyapa dan memberikan pesan sambutan setiap ada anggota baru yang bergabung ke grup.'
      );
    } else if (action === 'off' || action === 'disable' || action === '0' || action === 'mati') {
      if (!group.welcome) {
        return m.reply('ℹ️ Fitur *Welcome Member* sudah dalam keadaan nonaktif.');
      }
      group.welcome = false;
      db.save();
      return m.reply('❌ *WELCOME MEMBER TELAH DINONAKTIFKAN!*');
    } else {
      return m.reply(
        `⚙️ *PENGATURAN WELCOME MEMBER*\n\n` +
        `• Status saat ini: *${group.welcome ? 'AKTIF (ON) ✅' : 'NONAKTIF (OFF) ❌'}*\n\n` +
        `Gunakan perintah:\n` +
        `• \`.welcome on\` (Untuk mengaktifkan)\n` +
        `• \`.welcome off\` (Untuk menonaktifkan)`
      );
    }
  }
};
