/**
 * Command: listprem
 * Menampilkan daftar seluruh member premium aktif
 */

const config = require('../../config');
const { db, formatDuration, formatDateWIB } = require('../../lib/database');

module.exports = {
  name: 'listprem',
  aliases: ['daftarprem', 'premiumlist'],
  category: 'owner',
  description: 'Melihat daftar seluruh member premium',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m }) => {
    const list = db.getAllPremiumUsers();

    if (!list || list.length === 0) {
      return m.reply(`📋 *DAFTAR MEMBER PREMIUM*\n\nSaat ini belum ada member premium aktif.`);
    }

    let text = `╭━━━「 *DAFTAR MEMBER PREMIUM* 」━━━\n`;
    text += `┃ Total Member: *${list.length} Pengguna*\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    list.forEach((u, idx) => {
      text += `*${idx + 1}. ${u.name || 'User'}* (+${u.number})\n`;
      text += `   • Sisa Limit: *${u.limit} / 50*\n`;
      text += `   • Sisa Masa: *${u.remaining ? formatDuration(u.remaining) : 'Permanen'}*\n`;
      text += `   • Kedaluwarsa: _${u.expires ? formatDateWIB(u.expires) : 'Permanen'}_\n\n`;
    });

    text += `💡 *Tips:* Gunakan \`${config.prefix}addprem <hari> <nomor>\` untuk menambah member.`;
    return m.reply(text);
  }
};
