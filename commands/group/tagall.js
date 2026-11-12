/**
 * Command: tagall
 * Mention semua member grup dengan daftar nomor urut
 */

module.exports = {
  name: 'tagall',
  aliases: ['everyone'],
  category: 'group',
  description: 'Mention semua member grup dengan daftar nama',
  usage: '[pesan tambahan]',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, text, groupMetadata }) => {
    const participants = groupMetadata?.participants || [];
    const groupName = groupMetadata?.subject || 'Grup';

    let tagMsg = `╭───「 *TAG ALL MEMBER* 」───\n`;
    tagMsg += `│ 🏷️ *Grup:* ${groupName}\n`;
    tagMsg += `│ 👥 *Total Member:* ${participants.length}\n`;
    if (text) {
      tagMsg += `│ 💬 *Pesan:* ${text}\n`;
    }
    tagMsg += `╰────────────────────────\n\n`;

    const mentions = [];
    participants.forEach((p, index) => {
      const num = p.id.split('@')[0];
      tagMsg += `${index + 1}. @${num}\n`;
      mentions.push(p.id);
    });

    tagMsg += `\n_Pesan otomatis dikirim oleh bot_`;

    await sock.sendMessage(m.chat, {
      text: tagMsg,
      mentions
    }, { quoted: m });
  }
};
