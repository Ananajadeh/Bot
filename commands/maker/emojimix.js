/**
 * Command: emojimix / mixemoji / emix
 * Emoji Mix - Gabungkan dua emoji menjadi satu stiker
 */

const neoxr = require('../../lib/neoxr');
const { createSticker } = require('../../lib/sticker');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'emojimix',
  aliases: ['mixemoji', 'emix', 'emojimixer'],
  category: 'maker',
  description: 'Gabungkan dua emoji menjadi satu stiker unik',
  usage: '<emoji1> <emoji2>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    const text = args.join(' ').trim();

    // Regex untuk mendeteksi emoji Unicode
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    const emojis = text.match(emojiRegex);

    if (!emojis || emojis.length < 2) {
      return m.reply(
        `⚠️ Masukkan *2 emoji* yang ingin digabungkan!\n\n*Contoh:*\n\`${config.prefix}${command} 😎 🔥\`\n\`${config.prefix}${command} 😂❤️\``
      );
    }

    const emoji1 = emojis[0];
    const emoji2 = emojis[1];

    await m.react('⏳');

    try {
      const res = await neoxr.emojimix(emoji1, emoji2);

      if (!res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res.msg || 'Gagal menggabungkan emoji. Kombinasi ini mungkin tidak tersedia.'}`);
      }

      const imgUrl = res.data.url;
      if (!imgUrl) {
        await m.react('❌');
        return m.reply('❌ URL gambar tidak ditemukan dalam respon API.');
      }

      const buffer = await neoxr.getBuffer(imgUrl);

      const stickerBuffer = await createSticker(buffer, {
        packname: config.botName,
        author: config.ownerName,
        isVideo: false
      });

      await sock.sendMessage(m.chat, {
        sticker: stickerBuffer
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      error(`[EMOJIMIX ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat menggabungkan emoji: ${err.message}`);
    }
  }
};
