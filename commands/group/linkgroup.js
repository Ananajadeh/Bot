/**
 * Command: linkgroup
 * Mengambil tautan undangan grup
 */

module.exports = {
  name: 'linkgroup',
  aliases: ['linkgc', 'link'],
  category: 'group',
  description: 'Mendapatkan link undangan grup WhatsApp',
  usage: '',
  groupOnly: true,
  adminOnly: false,
  botAdminOnly: true,
  ownerOnly: false,

  execute: async ({ sock, m, groupMetadata }) => {
    try {
      const code = await sock.groupInviteCode(m.chat);
      const link = `https://chat.whatsapp.com/${code}`;
      const groupName = groupMetadata?.subject || 'Grup';

      await m.reply(`🔗 *Link Undangan Grup:*\n*${groupName}*\n\n${link}`);
    } catch (err) {
      await m.reply(`❌ Gagal mengambil link grup: ${err.message}`);
    }
  }
};
