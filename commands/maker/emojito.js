/**
 * Command: emojito / emojianim / emojianimasi / emoanim
 * Emoji to Animation - Mengubah emoji menjadi stiker animasi Google Noto Emoji
 * API: https://api.neoxr.eu/api/emojito
 */

const axios = require('axios');
const { createSticker } = require('../../lib/sticker');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'emojito',
  aliases: ['emojianim', 'emojianimasi', 'emoanim', 'notoemoji', 'emotanim'],
  category: 'maker',
  description: 'Ubah emoji menjadi stiker animasi Google Noto Emoji',
  usage: '<emoji>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    // Ambil input dari argumen atau dari pesan yang di-reply
    let text = args.join(' ').trim();
    if (!text && m.quoted && m.quoted.text) {
      text = m.quoted.text.trim();
    }

    // Deteksi emoji menggunakan regex Unicode
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Extended_Pictographic})/gu;
    const match = text.match(emojiRegex);

    if (!match || match.length === 0) {
      return m.reply(
        `⚠️ Masukkan *1 emoji* yang ingin diubah menjadi animasi!\n\n` +
        `*Contoh:*\n` +
        `\`${config.prefix}${command} 😳\`\n` +
        `\`${config.prefix}${command} 🔥\`\n` +
        `\`${config.prefix}${command} 🤖\`\n\n` +
        `_Atau balas (reply) pesan yang berisi emoji dengan perintah ini._`
      );
    }

    const targetEmoji = match[0];

    await m.react('⏳');

    try {
      // Ambil data animasi dari API Neoxr Emojito
      const response = await axios.get('https://api.neoxr.eu/api/emojito', {
        params: {
          q: targetEmoji,
          apikey: config.neoxrApiKey
        },
        timeout: 60000
      });

      const resData = response.data;

      if (!resData || !resData.status || !resData.data || !resData.data.url) {
        await m.react('❌');
        return m.reply(`❌ ${resData?.msg || 'Gagal mengubah emoji ke animasi. Emoji tersebut mungkin belum tersedia dalam animasi Google Noto Emoji.'}`);
      }

      const animUrl = resData.data.url;

      // Unduh file animasi WebP
      const webpResponse = await axios.get(animUrl, {
        responseType: 'arraybuffer',
        timeout: 60000
      });
      const webpBuffer = Buffer.from(webpResponse.data);

      // Konversi ke stiker animasi WhatsApp ber-EXIF
      const stickerBuffer = await createSticker(webpBuffer, {
        packname: config.botName,
        author: config.ownerName
      });

      // Kirim stiker animasi ke WhatsApp
      await sock.sendMessage(
        m.chat,
        { sticker: stickerBuffer },
        { quoted: m }
      );

      await m.react('✅');
    } catch (err) {
      error(`[EMOJITO ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat memproses emoji: ${err.response?.data?.msg || err.message}`);
    }
  }
};
