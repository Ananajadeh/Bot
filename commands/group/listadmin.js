/**
 * Command: listadmin
 * Menampilkan daftar seluruh Admin di grup
 */

module.exports = {
  name: 'listadmin',
  aliases: ['adminlist', 'daftaradmin'],
  category: 'group',
  description: 'Menampilkan daftar seluruh Admin grup',
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

    if (admins.length === 0) {
      return m.reply('ℹ️ Tidak ditemukan admin pada grup ini.');
    }

    let text = `╭━━━「 *DAFTAR ADMIN GRUP* 」━━━\n`;
    text += `┃ 🏷️ *Grup:* ${groupMetadata.subject || 'Grup'}\n`;
    text += `┃ 🛡️ *Total Admin:* ${admins.length} Admin\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    const mentions = [];
    admins.forEach((admin, i) => {
      const num = admin.id.split('@')[0];
      const role = admin.admin === 'superadmin' ? '👑 Superadmin (Owner GC)' : '🛡️ Admin';
      text += `${i + 1}. @${num} - _${role}_\n`;
      mentions.push(admin.id);
    });

    text += `\n_Gunakan perintah dengan bijak untuk ketertiban grup._`;

    await m.reply(text, { mentions });
  }
};
