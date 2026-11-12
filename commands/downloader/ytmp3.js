/**
 * Command: ytmp3 / yta / ytaudio
 * Download Audio YouTube MP3
 */

const neoxr = require('../../lib/neoxr');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'ytmp3',
  aliases: ['yta', 'ytaudio'],
  category: 'downloader',
  description: 'Download Audio YouTube (MP3)',
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
      const res = await neoxr.youtube(url, 'audio', '128kbps');
      if (!res.status || !res.data?.url) {
        await m.react('❌');
        return m.reply(`❌ ${res.msg || 'Gagal mengonversi audio YouTube.'}`);
      }

      const infoText =
        `🎵 *YOUTUBE AUDIO (MP3)*\n\n` +
        `📌 *Judul:* ${res.title}\n` +
        `⏱️ *Durasi:* ${res.duration || '-'}\n` +
        `📦 *Ukuran:* ${res.data.size || '-'}\n` +
        `🔊 *Kualitas:* ${res.data.quality || '128kbps'}\n\n` +
        `_Sedang mengirim audio..._`;

      await m.reply(infoText);

      // Download audio buffer
      const audioBuffer = await neoxr.getBuffer(res.data.url);

      await sock.sendMessage(m.chat, {
        audio: audioBuffer,
        mimetype: 'audio/mp4',
        fileName: `${res.title}.mp3`
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      error(`[YTMP3 ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Gagal download audio YouTube: ${err.message}`);
    }
  }
};
