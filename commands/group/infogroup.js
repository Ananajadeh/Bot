/**
 * Command: infogroup
 * Menampilkan detail informasi lengkap tentang grup WhatsApp
 */

const config = require('../../config');
const { db, formatDuration, formatDateWIB } = require('../../lib/database');

module.exports = {
  name: 'infogroup',
  aliases: ['groupinfo', 'infogrup', 'grupinfo'],
  category: 'group',
  description: 'Menampilkan detail lengkap statistik dan informasi grup',
  usage: '',
  groupOnly: true,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m, groupMetadata }) => {
    if (!groupMetadata) {
      return m.reply('❌ Gagal memuat metadata grup.');
    }

    const participants = groupMetadata.participants || [];
    const admins = participants.filter((p) => p.admin === 'admin' || p.admin === 'superadmin');
    const createdDate = groupMetadata.creation ? formatDateWIB(groupMetadata.creation * 1000) : '-';
    const groupData = db.getGroup(m.chat, groupMetadata.subject);

    let sewaStatus = 'Belum Disewa (Free)';
    if (groupData.rented && groupData.rentExpires) {
      const remaining = groupData.rentExpires - Date.now();
      sewaStatus = remaining > 0 ? `Aktif (${formatDuration(remaining)})` : 'Kedaluwarsa';
    }

    let text = `╭━━━「 *INFORMASI GRUP* 」━━━\n`;
    text += `┃ 🏷️ *Nama Grup:* ${groupMetadata.subject || '-'}\n`;
    text += `┃ 🆔 *ID Grup:* \`${groupMetadata.id}\`\n`;
    text += `┃ 👑 *Owner Grup:* @${(groupMetadata.owner || '').split('@')[0] || 'Tidak diketahui'}\n`;
    text += `┃ 📅 *Dibuat:* ${createdDate}\n`;
    text += `┃ 👥 *Total Member:* ${participants.length} Anggota\n`;
    text += `┃ 🛡️ *Total Admin:* ${admins.length} Admin\n`;
    text += `┃ 🔒 *Izin Pesan:* ${groupMetadata.announce ? 'Hanya Admin' : 'Semua Peserta'}\n`;
    text += `┃ ⚙️ *Edit Info:* ${groupMetadata.restrict ? 'Hanya Admin' : 'Semua Peserta'}\n`;
    text += `┃ 🤖 *Status Sewa:* ${sewaStatus}\n`;
    text += `┣━━━「 *FITUR KEAMANAN* 」━━━\n`;
    text += `┃ 🤬 *Anti-Toxic:* ${groupData.antitoxic ? 'ON ✅' : 'OFF ❌'}\n`;
    text += `┃ 💣 *Anti-Virtex:* ${groupData.antivirtex ? 'ON ✅' : 'OFF ❌'}\n`;
    text += `┃ 📢 *Anti-Tagall:* ${groupData.antitagall ? 'ON ✅' : 'OFF ❌'}\n`;
    text += `┃ 🎴 *Anti-Sticker Spam:* ${groupData.antistickerspam ? 'ON ✅' : 'OFF ❌'}\n`;
    text += `┃ 👋 *Welcome Member:* ${groupData.welcome ? 'ON ✅' : 'OFF ❌'}\n`;
    text += `┃ 🚪 *Goodbye Member:* ${groupData.goodbye ? 'ON ✅' : 'OFF ❌'}\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (groupMetadata.desc) {
      text += `📝 *Deskripsi Grup:*\n${groupMetadata.desc.toString()}\n`;
    }

    return m.reply(text, {
      mentions: groupMetadata.owner ? [groupMetadata.owner] : []
    });
  }
};
