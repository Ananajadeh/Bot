/**
 * Command: ytmp4 / ytv / ytvideo
 * Download Video YouTube MP4
 */

const neoxr = require('../../lib/neoxr');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'ytmp4',
  aliases: ['ytv', 'ytvideo'],
  category: 'downloader',
  description: 'Download Video YouTube (MP4)',
  usage: '<url youtube>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    const url = args[0];
    if (!url || !url.match(/(youtube\.com|youtu\.be)/i)) {
      return m.reply(
        `⚠️ Masukkan link YouTube yang valid!\n\n*Contoh:*\n\`${config.prefix}${command} https://youtu.be/xxxx\``
      );
    }

    await m.react('⏳');
    await m.reply(config.messages.wait);

    try {
      const res = await neoxr.youtube(url, 'video', '360p');
      if (!res.status || !res.data?.url) {
        await m.react('❌');
        return m.reply(`❌ ${res.msg || 'Gagal mengunduh video YouTube.'}`);
      }

      const caption =
        `🎬 *YOUTUBE VIDEO (MP4)*\n\n` +
        `📌 *Judul:* ${res.title}\n` +
        `⏱️ *Durasi:* ${res.duration || '-'}\n` +
        `📦 *Ukuran:* ${res.data.size || '-'}\n` +
        `📺 *Kualitas:* ${res.data.quality || '360p'}\n\n` +
        `_${config.footer}_`;

      // Download video buffer
      const videoBuffer = await neoxr.getBuffer(res.data.url);

      await sock.sendMessage(m.chat, {
        video: videoBuffer,
        caption
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      error(`[YTMP4 ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Gagal download video YouTube: ${err.message}`);
    }
  }
};
