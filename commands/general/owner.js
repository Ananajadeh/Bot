/**
 * Command: owner
 * Mengirim kontak vCard resmi Owner bot
 */

const config = require('../../config');
const { normalizeNumber } = require('../../lib/serialize');

module.exports = {
  name: 'owner',
  aliases: ['creator', 'pemilik'],
  category: 'general',
  description: 'Menampilkan kontak resmi Owner bot',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m }) => {
    const rawNumber = Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : config.ownerNumber;
    const cleanNumber = normalizeNumber(rawNumber);

    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      `FN:${config.ownerName}\n` +
      `ORG:${config.botName}\n` +
      `TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}\n` +
      'END:VCARD';

    await sock.sendMessage(m.chat, {
      contacts: {
        displayName: config.ownerName,
        contacts: [{ vcard }]
      }
    }, { quoted: m });

    await m.reply(`👋 Itu adalah kontak Owner *${config.botName}* (${config.ownerName}). Silakan hubungi jika ada keperluan penting.`);
  }
};
