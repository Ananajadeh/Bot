/**
 * Command: removebg / rbg / nobg / hapusbg
 * Remove Background - Hapus latar belakang gambar menggunakan AI
 */

const neoxr = require('../../lib/neoxr');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'removebg',
  aliases: ['rbg', 'nobg', 'hapusbg', 'rembg'],
  category: 'maker',
  description: 'Hapus latar belakang gambar menggunakan AI',
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

      const res = await neoxr.removebg(imgUrl);

      if (!res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res.msg || 'Gagal menghapus latar belakang gambar.'}`);
      }

      const resultUrl = res.data.url || res.data.no_background;
      if (!resultUrl) {
        await m.react('❌');
        return m.reply('❌ URL hasil tidak ditemukan dalam respon API.');
      }

      const resultBuffer = await neoxr.getBuffer(resultUrl);

      // Kirim sebagai stiker (transparan) dan juga sebagai gambar
      await sock.sendMessage(m.chat, {
        image: resultBuffer,
        caption: `🖼️ *REMOVE BACKGROUND*\n🔍 Latar belakang gambar berhasil dihapus!\n\n_${config.footer}_`
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      error(`[REMOVEBG ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat menghapus background: ${err.message}`);
    }
  }
};
