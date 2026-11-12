/**
 * Command: cekprem / limit / me
 * Menampilkan status profil pengguna, sisa limit harian, dan masa aktif premium
 */

const config = require('../../config');
const { db, formatDuration, formatDateWIB } = require('../../lib/database');

module.exports = {
  name: 'limit',
  aliases: ['cekprem', 'me', 'profile', 'status', 'ceklimit'],
  category: 'general',
  description: 'Mengecek sisa limit harian dan status premium pengguna',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m }) => {
    const user = db.getUser(m.senderNumber, m.pushName);

    let statusText = 'Free Member (Reguler)';
    let limitMax = '5';
    let sisaLimit = user.limit;

    if (m.isOwner) {
      statusText = '👑 Owner Bot (Developer)';
      limitMax = 'Unlimited';
      sisaLimit = '∞ (Tanpa Batas)';
    } else if (user.premium) {
      statusText = '⭐ Member Premium';
      limitMax = '50';
    }

    let text = `╭━━━「 *PROFIL PENGGUNA* 」━━━\n`;
    text += `┃ 👤 *Nama:* ${m.pushName || 'User'}\n`;
    text += `┃ 📱 *Nomor:* +${m.senderNumber}\n`;
    text += `┃ 🏷️ *Status:* ${statusText}\n`;
    text += `┃ 🎟️ *Sisa Limit:* ${sisaLimit} / ${limitMax}\n`;

    if (user.premium && user.premiumExpires) {
      const remaining = user.premiumExpires - Date.now();
      text += `┃ ⏱️ *Sisa Premium:* ${formatDuration(remaining)}\n`;
      text += `┃ 📅 *Kedaluwarsa:* ${formatDateWIB(user.premiumExpires)}\n`;
    }

    text += `┃ ⏰ *Reset Limit:* Pukul 05:00 WIB Setiap Hari\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (!user.premium && !m.isOwner) {
      text += `💡 *Keuntungan Upgrade ke Premium:*\n`;
      text += `• Dapatkan *50 Limit Harian* (Reguler hanya 5 limit)\n`;
      text += `• Bebas gunakan bot di *Private Chat*\n`;
      text += `• Prioritas respon bot lebih cepat\n\n`;
      text += `Hubungi Owner untuk upgrade: \`${config.prefix}owner\``;
    }

    return m.reply(text);
  }
};
