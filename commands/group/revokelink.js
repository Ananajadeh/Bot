/**
 * Command: revokelink
 * Mereset / mencabut tautan undangan grup lama dan membuat tautan baru
 */

module.exports = {
  name: 'revokelink',
  aliases: ['resetlink', 'resetlinkgc', 'resetlinkgrup'],
  category: 'group',
  description: 'Mereset link undangan grup lama',
  usage: '',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: true,
  ownerOnly: false,

  execute: async ({ sock, m }) => {
    try {
      const newCode = await sock.groupRevokeInvite(m.chat);
      const link = `https://chat.whatsapp.com/${newCode}`;

      await m.reply(`🔄 *Link grup berhasil direset!*\nTautan undangan baru:\n${link}`);
    } catch (err) {
      await m.reply(`❌ Gagal mereset link grup: ${err.message}`);
    }
  }
};
