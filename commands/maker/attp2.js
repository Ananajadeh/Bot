/**
 * Command: attp2
 * Animated Text To Picture Style 2 - Stiker teks animasi gaya kedua
 */

const neoxr = require('../../lib/neoxr');
const { createSticker } = require('../../lib/sticker');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'attp2',
  aliases: ['ttp2'],
  category: 'maker',
  description: 'Buat stiker teks animasi gaya ke-2 (ATTP2)',
  usage: '<teks>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    let text = args.join(' ').trim();
    if (!text && m.quoted && m.quoted.text) {
      text = m.quoted.text.trim();
    }

    if (!text) {
      return m.reply(
        `⚠️ Masukkan teks yang ingin dijadikan stiker animasi!\n\n*Contoh:*\n\`${config.prefix}${command} Hello World\`\natau balas pesan teks dengan \`${config.prefix}${command}\``
      );
    }

    await m.react('⏳');

    try {
      const res = await neoxr.attp2(text);

      if (!res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res.msg || 'Gagal membuat stiker ATTP2.'}`);
      }

      const mediaUrl = res.data.url;
      if (!mediaUrl) {
        await m.react('❌');
        return m.reply('❌ URL media tidak ditemukan dalam respon API.');
      }

      const buffer = await neoxr.getBuffer(mediaUrl);

      const stickerBuffer = await createSticker(buffer, {
        packname: config.botName,
        author: config.ownerName,
        isVideo: true
      });

      await sock.sendMessage(m.chat, {
        sticker: stickerBuffer
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      error(`[ATTP2 ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat membuat stiker ATTP2: ${err.message}`);
    }
  }
};
