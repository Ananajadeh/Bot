/**
 * Command: sticker / s / stiker / sgif
 * Mengubah Foto, Video, atau GIF menjadi Stiker WhatsApp
 */

const { createSticker } = require('../../lib/sticker');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'sticker',
  aliases: ['s', 'stiker', 'sgif'],
  category: 'maker',
  description: 'Konversi Foto, Video (< 7 detik), atau GIF ke Stiker WhatsApp',
  usage: '[Kirim/balas gambar atau video dengan caption .s]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    // Periksa apakah pesan saat ini atau pesan yang dibalas berisi media
    const isQuotedMedia = m.quoted && m.quoted.isMedia;
    const isDirectMedia = ['imageMessage', 'videoMessage', 'stickerMessage'].includes(m.type);

    if (!isQuotedMedia && !isDirectMedia) {
      return m.reply(
        `⚠️ Kirim gambar/video/GIF dengan caption \`${config.prefix}${command}\` atau balas gambar/video/GIF yang sudah ada!`
      );
    }

    // Tentukan apakah berupa video
    const isQuotedVideo = m.quoted && (m.quoted.type === 'videoMessage');
    const isDirectVideo = m.type === 'videoMessage';
    const isVideo = isQuotedVideo || isDirectVideo;

    // Cek durasi video jika ada (maksimal 10 detik agar stiker tidak terlalu berat)
    const videoSeconds = (m.quoted?.message?.videoMessage?.seconds) || (m.message?.videoMessage?.seconds);
    if (videoSeconds && videoSeconds > 10) {
      return m.reply('⚠️ Durasi video maksimal 10 detik untuk dijadikan stiker animasi!');
    }

    await m.react('⏳');

    try {
      // Unduh buffer media menggunakan helper serialisasi Baileys
      const buffer = await m.download();
      if (!buffer || buffer.length === 0) {
        await m.react('❌');
        return m.reply('❌ Gagal mengunduh file media. Silakan coba kirim ulang.');
      }

      // Packname & Author custom jika ada argumen
      // Contoh: .s NamaPack | NamaAuthor
      let packname = config.botName;
      let author = config.ownerName;

      const text = args.join(' ').trim();
      if (text.includes('|')) {
        const parts = text.split('|');
        packname = parts[0].trim() || packname;
        author = parts[1].trim() || author;
      } else if (text) {
        packname = text;
      }

      // Konversi buffer ke WebP Stiker dengan Exif resmi
      const stickerBuffer = await createSticker(buffer, {
        packname,
        author,
        isVideo
      });

      // Kirim stiker ke chat
      await sock.sendMessage(m.chat, {
        sticker: stickerBuffer
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      error(`[STICKER ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Gagal membuat stiker: ${err.message || 'Format media tidak didukung'}`);
    }
  }
};
