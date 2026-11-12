/**
 * Command: ai
 * Fitur Chat AI Cerdas, Friendly, Gaul & Seru (Neoxr API)
 */

const config = require('../../config');
const neoxr = require('../../lib/neoxr');

module.exports = {
  name: 'ai',
  aliases: ['bard', 'cai', 'tanya', 'chat', 'gemini'],
  category: 'ai',
  description: 'Ngobrol dengan AI ramah, gaul & seru (Neoxr)',
  usage: '<pertanyaan / pesan>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m, text }) => {
    // Ambil pertanyaan dari teks langsung atau dari pesan yang di-reply
    let query = text;
    if (!query && m.quoted && m.quoted.text) {
      query = m.quoted.text;
    }

    if (!query) {
      return m.reply(
        `💡 *Cara Menggunakan Fitur AI:*\n\n` +
        `Ketik: \`${config.prefix}ai <pertanyaan>\`\n` +
        `Atau balas (reply) pesan dengan: \`${config.prefix}ai\`\n\n` +
        `*Contoh:* \`${config.prefix}ai apa itu fotosintesis?\`\n` +
        `*Contoh:* \`${config.prefix}ai ceritakan lelucon lucu\``
      );
    }

    try {
      await m.react('⏳');
      const senderName = m.pushName || 'Kawan';
      const response = await neoxr.aiChat(query, senderName);

      await m.react('✨');
      await m.reply(response);
    } catch (err) {
      await m.react('❌');
      await m.reply(`❌ *AI Error:* ${err.message || 'Gagal memproses jawaban AI.'}`);
    }
  }
};
