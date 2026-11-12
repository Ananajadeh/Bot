/**
 * Command: remini / hd / enhance / upscale
 * Remini - AI Image Enhancer / Upscale gambar
 */

const neoxr = require('../../lib/neoxr');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'remini',
  aliases: ['hd', 'enhance', 'upscale', 'jernih'],
  category: 'maker',
  description: 'Perjelas dan perbesar resolusi gambar menggunakan AI (Remini)',
  usage: '[kirim/balas gambar]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    const isQuotedImage = m.quoted && m.quoted.type === 'imageMessage';
    const isDirectImage = m.type === 'imageMessage';

    if (!isQuotedImage && !isDirectImage) {
      return m.reply(
        `⚠️ Kirim gambar dengan caption \`${config.prefix}${command}\` atau balas gambar yang sudah ada!\n\n*Contoh:*\nKirim foto lalu beri caption \`${config.prefix}${command}\``
      );
    }

    await m.react('⏳');

    try {
      // Download gambar
      const imgBuffer = await m.download();
      if (!imgBuffer || imgBuffer.length === 0) {
        await m.react('❌');
        return m.reply('❌ Gagal mengunduh gambar. Silakan coba kirim ulang.');
      }

      // Upload gambar ke server sementara untuk mendapatkan URL
      const imgUrl = await neoxr.uploadImage(imgBuffer);

      const res = await neoxr.remini(imgUrl);

      if (!res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res.msg || 'Gagal memproses gambar dengan Remini.'}`);
      }

      const resultUrl = res.data.url;
      if (!resultUrl) {
        await m.react('❌');
        return m.reply('❌ URL hasil tidak ditemukan dalam respon API.');
      }

      const resultBuffer = await neoxr.getBuffer(resultUrl);

      await sock.sendMessage(m.chat, {
        image: resultBuffer,
        caption: `✨ *REMINI - AI Image Enhancer*\n📐 Gambar telah diperjelas & ditingkatkan resolusinya\n\n_${config.footer}_`
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      error(`[REMINI ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat memproses Remini: ${err.message}`);
    }
  }
};
