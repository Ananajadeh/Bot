/**
 * Command: play / lagu / ytplay
 * Putar lagu & download audio YouTube berdasarkan judul lagu
 */

const neoxr = require('../../lib/neoxr');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'play',
  aliases: ['lagu', 'ytplay'],
  category: 'downloader',
  description: 'Mencari lagu di YouTube dan mengunduh audionya',
  usage: '<judul lagu / nama artis>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, text, command }) => {
    if (!text) {
      return m.reply(
        `⚠️ Masukkan judul lagu yang ingin dicari!\n\n*Contoh:*\n\`${config.prefix}${command} Nadin Amizah Bertaut\``
      );
    }

    await m.react('⏳');
    await m.reply(config.messages.wait);

    try {
      const res = await neoxr.play(text);
      if (!res.status || !res.data?.url) {
        await m.react('❌');
        return m.reply(`❌ ${res.msg || 'Lagu tidak ditemukan.'}`);
      }

      const infoText =
        `🎵 *YOUTUBE PLAY*\n\n` +
        `📌 *Judul:* ${res.title}\n` +
        `👤 *Channel:* ${res.channel || '-'}\n` +
        `⏱️ *Durasi:* ${res.duration || '-'}\n` +
        `📦 *Ukuran:* ${res.data.size || '-'}\n\n` +
        `_Sedang mengirim audio..._`;

      if (res.thumbnail) {
        try {
          const thumbBuf = await neoxr.getBuffer(res.thumbnail);
          await sock.sendMessage(m.chat, {
            image: thumbBuf,
            caption: infoText
          }, { quoted: m });
        } catch {
          await m.reply(infoText);
        }
      } else {
        await m.reply(infoText);
      }

      // Download audio buffer
      const audioBuffer = await neoxr.getBuffer(res.data.url);

      await sock.sendMessage(m.chat, {
        audio: audioBuffer,
        mimetype: 'audio/mp4',
        fileName: `${res.title}.mp3`
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      error(`[PLAY ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Gagal memutar lagu: ${err.message}`);
    }
  }
};
