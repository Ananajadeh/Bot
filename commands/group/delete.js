/**
 * Command: delete / del
 * Menghapus pesan di grup (pesan bot sendiri atau pesan member lain jika bot admin)
 */

const config = require('../../config');

module.exports = {
  name: 'delete',
  aliases: ['del', 'hapus', 'd'],
  category: 'group',
  description: 'Menghapus pesan bot atau pesan member lain di grup',
  usage: '(reply pesan yang ingin dihapus)',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, isBotAdmin, isOwner }) => {
    if (!m.quoted) {
      return m.reply(`⚠️ Balas (reply) pesan yang ingin dihapus dengan \`${config.prefix}delete\``);
    }

    // Jika pesan yang di-reply bukan dari bot sendiri, bot harus menjadi admin grup
    if (!m.quoted.fromMe && !isBotAdmin) {
      return m.reply(config.messages.botAdmin);
    }

    try {
      await sock.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: m.quoted.fromMe,
          id: m.quoted.id,
          participant: m.quoted.sender
        }
      });
    } catch (err) {
      return m.reply(`❌ Gagal menghapus pesan: ${err.message}`);
    }
  }
};
