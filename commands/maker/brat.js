/**
 * Command: brat / brattext / brattex
 * Generator Stiker Teks Gaya Brat (Charli XCX) menggunakan Neoxr API
 */

const neoxr = require('../../lib/neoxr');
const { createSticker } = require('../../lib/sticker');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'brat',
  aliases: ['brattext', 'brattex', 'tbrat'],
  category: 'maker',
  description: 'Buat stiker teks gaya album Brat (Charli XCX)',
  usage: '<teks>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    // Ambil teks dari argumen perintah atau dari pesan yang dibalas
    let text = args.join(' ').trim();
    if (!text && m.quoted && m.quoted.text) {
      text = m.quoted.text.trim();
    }

    if (!text) {
      return m.reply(
        `⚠️ Masukkan teks yang ingin dijadikan stiker Brat!\n\n*Contoh:*\n\`${config.prefix}${command} kamus gila\`\natau balas pesan teks dengan \`${config.prefix}${command}\``
      );
    }

    await m.react('⏳');

    try {
      // Panggil API Neoxr dengan API key yang sama (config.neoxrApiKey)
      const res = await neoxr.brat(text);

      if (!res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res.msg || 'Gagal membuat gambar Brat.'}`);
      }

      const imgUrl = res.data.url;
      if (!imgUrl) {
        await m.react('❌');
        return m.reply('❌ URL gambar tidak ditemukan dalam respon API.');
      }

      // Unduh buffer gambar PNG dari Neoxr
      const pngBuffer = await neoxr.getBuffer(imgUrl);

      // Konversi ke format stiker WebP WhatsApp dengan Exif resmi
      const stickerBuffer = await createSticker(pngBuffer, {
        packname: config.botName,
        author: config.ownerName,
        isVideo: false
      });

      // Kirim stiker langsung ke pengguna
      await sock.sendMessage(m.chat, {
        sticker: stickerBuffer
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      error(`[BRAT ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat membuat stiker Brat: ${err.message}`);
    }
  }
};
