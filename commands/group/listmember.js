/**
 * Command: listmember
 * Menampilkan daftar seluruh anggota yang tergabung di dalam grup
 */

module.exports = {
  name: 'listmember',
  aliases: ['memberlist', 'daftarmember'],
  category: 'group',
  description: 'Menampilkan daftar seluruh member grup',
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
    if (participants.length === 0) {
      return m.reply('ℹ️ Tidak ada anggota dalam grup.');
    }

    let text = `╭━━━「 *DAFTAR MEMBER GRUP* 」━━━\n`;
    text += `┃ 🏷️ *Grup:* ${groupMetadata.subject || 'Grup'}\n`;
    text += `┃ 👥 *Total Member:* ${participants.length} Anggota\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    participants.forEach((p, i) => {
      const num = p.id.split('@')[0];
      const tag = p.admin === 'superadmin' ? ' [👑 Superadmin]' : p.admin === 'admin' ? ' [🛡️ Admin]' : '';
      text += `${i + 1}. +${num}${tag}\n`;
    });

    text += `\n_Daftar anggota aktif ${groupMetadata.subject || 'Grup'}_`;

    await m.reply(text);
  }
};
