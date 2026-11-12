/**
 * Command: tiktok / tt / ttdl
 * Download Video TikTok No Watermark & Audio
 */

const neoxr = require('../../lib/neoxr');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'tiktok',
  aliases: ['tt', 'ttdl', 'tiktokdl'],
  category: 'downloader',
  description: 'Download video TikTok tanpa watermark dan audio',
  usage: '<url video tiktok>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    const url = args[0];
    if (!url || !url.match(/tiktok\.com/i)) {
      return m.reply(
        `⚠️ Masukkan URL TikTok yang valid!\n\n*Contoh:*\n\`${config.prefix}${command} https://vt.tiktok.com/xxxx/\``
      );
    }

    await m.react('⏳');
    await m.reply(config.messages.wait);

    try {
      const res = await neoxr.tiktok(url);
      if (!res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res.msg || 'Gagal mengambil video TikTok. Pastikan video bersifat publik.'}`);
      }

      const data = res.data;
      const caption =
        `🎬 *TIKTOK DOWNLOADER*\n\n` +
        `👤 *Author:* ${data.author?.nickname || data.author?.name || 'TikTok User'}\n` +
        `📝 *Deskripsi:* ${data.caption || data.title || '-'}\n\n` +
        `_${config.footer}_`;

      // Jika berupa foto / slide gambar
      if (data.photo && Array.isArray(data.photo) && data.photo.length > 0) {
        for (let i = 0; i < data.photo.length; i++) {
          const imgUrl = typeof data.photo[i] === 'object' ? data.photo[i].url : data.photo[i];
          const imgBuf = await neoxr.getBuffer(imgUrl);
          await sock.sendMessage(m.chat, {
            image: imgBuf,
            caption: i === 0 ? caption : `Slide ${i + 1}/${data.photo.length}`
          }, { quoted: m });
        }
      } else {
        // Berupa video
        const videoUrl =
          (Array.isArray(data.video) ? data.video[0]?.url || data.video[0] : null) ||
          data.video ||
          data.url ||
          data.play;

        if (!videoUrl) {
          await m.react('❌');
          return m.reply('❌ Link video tidak ditemukan dalam respon.');
        }

        const directUrl = typeof videoUrl === 'object' ? videoUrl.url : videoUrl;
        
        // Unduh buffer video menggunakan helper IPv4
        const videoBuffer = await neoxr.getBuffer(directUrl);

        await sock.sendMessage(m.chat, {
          video: videoBuffer,
          caption
        }, { quoted: m });
      }

      await m.react('✅');
    } catch (err) {
      error(`[TIKTOK ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Gagal download TikTok: ${err.message}`);
    }
  }
};
