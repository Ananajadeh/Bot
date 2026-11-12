/**
 * Command: ceksewa
 * Mengecek sisa waktu sewa bot di grup saat ini
 */

const config = require('../../config');
const { db, formatDuration, formatDateWIB } = require('../../lib/database');

module.exports = {
  name: 'ceksewa',
  aliases: ['sewainfo', 'sewabotinfo'],
  category: 'group',
  description: 'Mengecek status & sisa waktu sewa bot di grup ini',
  usage: '',
  groupOnly: true,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m, groupMetadata }) => {
    const groupName = groupMetadata?.subject || 'Grup Ini';
    const group = db.getGroup(m.chat, groupName);

    if (!group.rented || !group.rentExpires) {
      return m.reply(
        `ℹ️ *INFORMASI SEWA GRUP*\n\n` +
        `Grup *${groupName}* belum terdaftar sebagai grup sewa berbayar.\n` +
        `Untuk menyewa bot agar selalu standby melayani grup, hubungi Owner:\n` +
        `Ketik: \`${config.prefix}owner\``
      );
    }

    const remainingMs = group.rentExpires - Date.now();
    if (remainingMs <= 0) {
      return m.reply(
        `⏳ *SEWA BOT SUDAH KEDALUWARSA!*\n\n` +
        `Masa sewa bot di grup *${groupName}* telah habis.\n` +
        `Silakan hubungi Owner untuk memperpanjang: \`${config.prefix}owner\``
      );
    }

    return m.reply(
      `╭━━━「 *STATUS SEWA BOT* 」━━━\n` +
      `┃ 👥 *Grup:* ${groupName}\n` +
      `┃ ⏱️ *Sisa Waktu:* ${formatDuration(remainingMs)}\n` +
      `┃ 📅 *Berakhir:* ${formatDateWIB(group.rentExpires)}\n` +
      `┃ 🟢 *Status:* Aktif & Terlindungi\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `_Hubungi Owner (\`${config.prefix}owner\`) jika ingin memperpanjang masa aktif bot._`
    );
  }
};
