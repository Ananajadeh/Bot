/**
 * Command: mute / unmute
 * Membuka atau menutup obrolan grup dengan cepat
 */

const config = require('../../config');

module.exports = {
  name: 'mute',
  aliases: ['unmute', 'tutup', 'buka'],
  category: 'group',
  description: 'Membuka atau menutup percakapan grup untuk umum',
  usage: '',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: true,
  ownerOnly: false,

  execute: async ({ sock, m, command }) => {
    try {
      if (command === 'mute' || command === 'tutup') {
        await sock.groupSettingUpdate(m.chat, 'announcement');
        return m.reply(`🔒 *GRUP DITUTUP!*\nSekarang hanya Admin yang dapat mengirim pesan di grup ini.`);
      } else {
        await sock.groupSettingUpdate(m.chat, 'not_announcement');
        return m.reply(`🔓 *GRUP DIBUKA!*\nSekarang semua member dapat mengirim pesan di grup ini.`);
      }
    } catch (err) {
      return m.reply(`❌ Gagal mengubah setelan grup: ${err.message}`);
    }
  }
};
