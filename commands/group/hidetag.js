/**
 * Command: hidetag
 * Mengirim pesan dengan mention tersembunyi ke semua member grup
 */

module.exports = {
  name: 'hidetag',
  aliases: ['ht', 'h'],
  category: 'group',
  description: 'Mention semua member grup secara tersembunyi',
  usage: '<pesan yang ingin disampaikan>',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, text, groupMetadata }) => {
    const participants = groupMetadata?.participants || [];
    const members = participants.map((p) => p.id);

    const messageText = text || (m.quoted ? m.quoted.text : '📢 Pengumuman untuk semua member grup!');

    if (!messageText) {
      return m.reply('⚠️ Masukkan teks pesan pengumuman!\nContoh: `.hidetag Rapat dimulai jam 8 malam`');
    }

    await sock.sendMessage(m.chat, {
      text: messageText,
      mentions: members
    });
  }
};
