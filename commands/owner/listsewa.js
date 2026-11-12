/**
 * Command: listsewa
 * Menampilkan daftar seluruh grup yang sedang menyewa bot
 */

const config = require('../../config');
const { db, formatDuration, formatDateWIB } = require('../../lib/database');

module.exports = {
  name: 'listsewa',
  aliases: ['daftarsewa'],
  category: 'owner',
  description: 'Melihat daftar grup yang sedang menyewa bot',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m }) => {
    const list = db.getAllRentedGroups();

    if (!list || list.length === 0) {
      return m.reply(`📋 *DAFTAR SEWA BOT*\n\nSaat ini belum ada grup yang menyewa bot aktif.`);
    }

    let text = `╭━━━「 *DAFTAR GRUP SEWA BOT* 」━━━\n`;
    text += `┃ Total Grup Aktif: *${list.length} Grup*\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    list.forEach((item, idx) => {
      text += `*${idx + 1}. ${item.name}*\n`;
      text += `   • ID: \`${item.jid}\`\n`;
      text += `   • Sisa Waktu: *${formatDuration(item.remaining)}*\n`;
      text += `   • Kedaluwarsa: _${formatDateWIB(item.expires)}_\n\n`;
    });

    text += `💡 *Tips:* Gunakan \`${config.prefix}addsewa <hari> <link>\` untuk menambah masa sewa.`;
    return m.reply(text);
  }
};
