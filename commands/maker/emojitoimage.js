/**
 * Command: emojitoimage / emojitoimg / emojipng / emotoimg
 * Emoji To Image - Mengubah emoji menjadi gambar PNG berkualitas tinggi (HD)
 * Mendukung gaya: Apple (default), Google, Twitter, Facebook
 */

const axios = require('axios');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'emojitoimage',
  aliases: ['emojitoimg', 'emojipng', 'emojigambar', 'emotoimg'],
  category: 'maker',
  description: 'Ubah emoji menjadi gambar PNG HD (Apple, Google, Twitter, Facebook)',
  usage: '<emoji> [gaya]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    let text = args.join(' ').trim();
    if (!text && m.quoted && m.quoted.text) {
      text = m.quoted.text.trim();
    }

    // Deteksi emoji menggunakan regex Unicode
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Extended_Pictographic})/gu;
    const match = text.match(emojiRegex);

    if (!match || match.length === 0) {
      return m.reply(
        `⚠️ Masukkan *1 emoji* yang ingin diubah menjadi gambar!\n\n` +
        `*Contoh:*\n` +
        `\`${config.prefix}${command} 😳\`\n` +
        `\`${config.prefix}${command} 🔥 google\`\n` +
        `\`${config.prefix}${command} 🤖 twitter\`\n\n` +
        `*Pilihan Gaya:* \`apple\` (default), \`google\`, \`twitter\`, \`facebook\`\n` +
        `_Atau balas (reply) pesan berisi emoji dengan perintah ini._`
      );
    }

    const targetEmoji = match[0];

    // Deteksi style opsional dari argumen teks
    const supportedStyles = ['apple', 'google', 'twitter', 'facebook'];
    let chosenStyle = 'apple';
    for (const word of text.toLowerCase().split(/\s+/)) {
      if (supportedStyles.includes(word)) {
        chosenStyle = word;
        break;
      }
    }

    await m.react('⏳');

    try {
      let imageBuffer = null;
      let finalStyle = chosenStyle;

      // Coba unduh dari CDN dengan gaya yang dipilih, fallback ke gaya lain jika gagal
      const stylesToAttempt = [chosenStyle, ...supportedStyles.filter((s) => s !== chosenStyle)];

      for (const style of stylesToAttempt) {
        try {
          const url = `https://emojicdn.elk.sh/${encodeURIComponent(targetEmoji)}?style=${style}`;
          const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000
          });
          if (res.data && res.data.length > 0) {
            imageBuffer = Buffer.from(res.data);
            finalStyle = style;
            break;
          }
        } catch {
          // Lanjut ke gaya fallback
        }
      }

      if (!imageBuffer) {
        await m.react('❌');
        return m.reply(`❌ Gambar untuk emoji *${targetEmoji}* tidak ditemukan.`);
      }

      // Kirim hasil sebagai gambar foto dengan caption informatif
      await sock.sendMessage(
        m.chat,
        {
          image: imageBuffer,
          caption: `✨ *EMOJI TO IMAGE*\n\n` +
            `◦ *Emoji :* ${targetEmoji}\n` +
            `◦ *Gaya  :* ${finalStyle.toUpperCase()}\n` +
            `◦ *Format:* PNG (HD)\n\n` +
            `_${config.footer}_`
        },
        { quoted: m }
      );

      await m.react('✅');
    } catch (err) {
      error(`[EMOJITOIMAGE ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat memproses emoji: ${err.message}`);
    }
  }
};
