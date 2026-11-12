/**
 * Command: botgroup
 * Mengaktifkan/menonaktifkan mode khusus grup (Bot Only Group)
 */

const config = require('../../config');
const { db } = require('../../lib/database');

module.exports = {
  name: 'botgroup',
  aliases: ['botonlygroup', 'onlygroup'],
  category: 'owner',
  description: 'Mengatur bot agar hanya bisa digunakan di grup (on/off)',
  usage: '<on / off / status>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m, args }) => {
    const action = (args[0] || '').toLowerCase();

    if (action === 'on' || action === 'enable' || action === '1') {
      db.data.settings.botOnlyGroup = true;
      db.save();
      return m.reply(
        `✅ *MODE BOT ONLY GROUP DIAKTIFKAN!*\n\n` +
        `Sekarang bot hanya merespon perintah di dalam Grup WhatsApp.\n` +
        `Private Chat hanya bisa digunakan oleh *Owner* dan *Member Premium*.`
      );
    } else if (action === 'off' || action === 'disable' || action === '0') {
      db.data.settings.botOnlyGroup = false;
      db.save();
      return m.reply(
        `✅ *MODE BOT ONLY GROUP DINONAKTIFKAN!*\n\n` +
        `Bot sekarang dapat merespon di grup maupun private chat (sesuai status premium).`
      );
    } else {
      const current = db.data.settings.botOnlyGroup ? 'AKTIF (Grup Saja)' : 'NONAKTIF (Publik)';
      return m.reply(
        `⚙️ *STATUS MODE BOT ONLY GROUP:*\n\n` +
        `• Status Saat Ini: *${current}*\n\n` +
        `*Cara Mengubah:* \n` +
        `• \`${config.prefix}botgroup on\`  : Aktifkan mode hanya grup\n` +
        `• \`${config.prefix}botgroup off\` : Nonaktifkan mode hanya grup`
      );
    }
  }
};
