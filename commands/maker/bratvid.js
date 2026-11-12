/**
 * Command: bratvid / bratvideo / bratvidio / bratv
 * Generator Stiker / Video Animasi Teks Bergerak Gaya Brat menggunakan Neoxr API
 */

const neoxr = require('../../lib/neoxr');
const { createSticker } = require('../../lib/sticker');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'bratvid',
  aliases: ['bratvideo', 'bratvidio', 'bratv', 'bratgif'],
  category: 'maker',
  description: 'Buat stiker animasi atau video teks berjalan gaya Brat',
  usage: '<teks>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    // Periksa apakah pengguna meminta format video mentah
    const wantVideo = args.includes('--video') || args.includes('-v');
    const filteredArgs = args.filter((a) => a !== '--video' && a !== '-v');

    let text = filteredArgs.join(' ').trim();
    if (!text && m.quoted && m.quoted.text) {
      text = m.quoted.text.trim();
    }

    if (!text) {
      return m.reply(
        `⚠️ Masukkan teks untuk stiker animasi Brat Video!\n\n*Contoh:*\n\`${config.prefix}${command} ini teks brat bergerak\`\n\n_Tambahkan \`--video\` di akhir jika ingin menerima format video MP4._`
      );
    }

    await m.react('⏳');

    try {
      // Panggil API Neoxr dengan API key yang sama (config.neoxrApiKey)
      const res = await neoxr.bratvid(text);

      if (!res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res.msg || 'Gagal membuat video Brat.'}`);
      }

      const vidUrl = res.data.url;
      if (!vidUrl) {
        await m.react('❌');
        return m.reply('❌ URL video tidak ditemukan dalam respon API.');
      }

      // Unduh buffer video MP4 dari Neoxr
      const videoBuffer = await neoxr.getBuffer(vidUrl);

      if (wantVideo) {
        // Kirim sebagai format video MP4
        await sock.sendMessage(m.chat, {
          video: videoBuffer,
          caption: `🟢 *BRAT VIDEO*\n\n_${config.footer}_`,
          mimetype: 'video/mp4'
        }, { quoted: m });
      } else {
        // Konversi ke format Stiker Animasi WebP WhatsApp dengan Exif resmi
        const stickerBuffer = await createSticker(videoBuffer, {
          packname: config.botName,
          author: config.ownerName,
          isVideo: true
        });

        // Kirim stiker animasi langsung ke chat
        await sock.sendMessage(m.chat, {
          sticker: stickerBuffer
        }, { quoted: m });
      }

      await m.react('✅');
    } catch (err) {
      error(`[BRATVID ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat membuat Brat Video: ${err.message}`);
    }
  }
};
