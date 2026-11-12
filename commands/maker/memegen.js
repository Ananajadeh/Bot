/**
 * Command: meme / memegen / memegenerator
 * Meme Generator - Buat meme dari gambar dengan teks atas & bawah
 */

const neoxr = require('../../lib/neoxr');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'meme',
  aliases: ['memegen', 'memegenerator', 'memmaker'],
  category: 'maker',
  description: 'Buat meme dari gambar dengan teks atas & bawah',
  usage: '<teks atas> | <teks bawah> (kirim/balas gambar)',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    // Cek apakah ada gambar yang dikirim atau dibalas
    const isQuotedImage = m.quoted && m.quoted.type === 'imageMessage';
    const isDirectImage = m.type === 'imageMessage';

    if (!isQuotedImage && !isDirectImage) {
      return m.reply(
        `⚠️ Kirim atau balas gambar dengan perintah ini!\n\n*Format:*\n\`${config.prefix}${command} teks atas | teks bawah\`\n\n*Contoh:*\n\`${config.prefix}${command} Ketika koding | Dan error terus\``
      );
    }

    const text = args.join(' ').trim();
    if (!text) {
      return m.reply(
        `⚠️ Masukkan teks meme!\n\n*Format:*\n\`${config.prefix}${command} teks atas | teks bawah\`\n\n*Contoh:*\n\`${config.prefix}${command} Ketika koding | Dan error terus\``
      );
    }

    // Parsing teks atas & bawah
    let top = text;
    let bottom = '';
    if (text.includes('|')) {
      const parts = text.split('|');
      top = parts[0].trim();
      bottom = parts.slice(1).join('|').trim();
    }

    await m.react('⏳');

    try {
      // Download gambar dan upload ke server sementara
      const imgBuffer = await m.download();
      if (!imgBuffer || imgBuffer.length === 0) {
        await m.react('❌');
        return m.reply('❌ Gagal mengunduh gambar. Silakan coba kirim ulang.');
      }

      const imgUrl = await neoxr.uploadImage(imgBuffer);

      const res = await neoxr.meme(top, bottom, imgUrl);

      if (!res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res.msg || 'Gagal membuat meme.'}`);
      }

      const memeUrl = res.data.url;
      if (!memeUrl) {
        await m.react('❌');
        return m.reply('❌ URL meme tidak ditemukan dalam respon API.');
      }

      const memeBuffer = await neoxr.getBuffer(memeUrl);

      await sock.sendMessage(m.chat, {
        image: memeBuffer,
        caption: `🎭 *MEME GENERATOR*\n\n_${config.footer}_`
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      error(`[MEME ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat membuat meme: ${err.message}`);
    }
  }
};
