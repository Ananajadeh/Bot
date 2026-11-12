const axios = require('axios');
const config = require('../../config');

module.exports = {
  name: 'pinterest',
  aliases: ['pin', 'pindl'],
  category: 'downloader',
  description: 'Download media dari Pinterest (gambar/video)',
  usage: '<url pinterest>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, text, command, groupMetadata, isOwner, isAdmin, isBotAdmin, user }) => {
    try {
      if (!text) {
        return await m.reply(
          `📌 *Pinterest Downloader*\n\n` +
          `Masukkan URL Pinterest.\n\n` +
          `Contoh:\n` +
          `• ${config.prefix || '.'}${command} https://pin.it/xxxxx\n` +
          `• ${config.prefix || '.'}${command} https://www.pinterest.com/pin/123456789/`
        );
      }

      const url = text.trim();

      if (!/^https?:\/\/(www\.)?(pinterest\.(com|id|co\.uk|fr|de|es|jp)|pin\.it)\//i.test(url)) {
        return await m.reply('❌ URL tidak valid. Pastikan link berasal dari Pinterest.');
      }

      await m.react('⏳');

      let mediaUrls = [];
      let title = '';
      let author = '';

      // Coba endpoint Neoxr
      try {
        const apiUrl = `https://api.neoxr.eu/api/pinterest?url=${encodeURIComponent(url)}&apikey=${config.neoxrApiKey || ''}`;
        const { data } = await axios.get(apiUrl, { timeout: 30000 });

        if (data && data.status && data.data) {
          const d = data.data;
          title = d.title || d.description || '';
          author = d.author || d.username || '';
          if (Array.isArray(d.medias)) {
            mediaUrls = d.medias.map(x => (typeof x === 'string' ? x : x.url)).filter(Boolean);
          } else if (d.url) {
            mediaUrls = [d.url];
          } else if (d.video) {
            mediaUrls = [d.video];
          }
        }
      } catch (e) {
        // lanjut ke fallback
      }

      // Fallback: scrape halaman pin
      if (!mediaUrls.length) {
        try {
          const { data: html } = await axios.get(url, {
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
            }
          });

          const ogVideo = html.match(/<meta[^>]+property=["']og:video["'][^>]+content=["']([^"']+)["']/i);
          const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
          const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);

          if (ogTitle) title = ogTitle[1];
          if (ogVideo) mediaUrls.push(ogVideo[1].replace(/&amp;/g, '&'));
          if (ogImage && !ogVideo) mediaUrls.push(ogImage[1].replace(/&amp;/g, '&'));
          if (ogImage && ogVideo) mediaUrls.push(ogImage[1].replace(/&amp;/g, '&'));
        } catch (e) {
          // abaikan
        }
      }

      if (!mediaUrls.length) {
        await m.react('❌');
        return await m.reply('❌ Gagal mengambil media. Pin mungkin privat atau URL tidak didukung.');
      }

      // Hapus duplikat
      mediaUrls = [...new Set(mediaUrls)];

      const caption = `📌 *PINTEREST DOWNLOADER*\n\n` +
        (title ? `📝 Judul: ${title}\n` : '') +
        (author ? `👤 Author: ${author}\n` : '') +
        `📦 Total media: ${mediaUrls.length}\n\n` +
        `_${config.botName || 'nayxilaa md'}_`;

      await m.reply(caption);

      const isVideo = (u) => /\.(mp4|mov|webm)(\?|$)/i.test(u);

      for (const mediaUrl of mediaUrls.slice(0, 10)) {
        try {
          if (isVideo(mediaUrl)) {
            await sock.sendMessage(
              m.chat,
              { video: { url: mediaUrl }, caption: title || '' },
              { quoted: m }
            );
          } else {
            await sock.sendMessage(
              m.chat,
              { image: { url: mediaUrl }, caption: title || '' },
              { quoted: m }
            );
          }
          await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
          await m.reply(`⚠️ Gagal mengirim salah satu media: ${mediaUrl}`);
        }
      }

      await m.react('✅');
    } catch (err) {
      console.error('[PINTEREST ERROR]', err);
      try { await m.react('❌'); } catch (_) {}
      await m.reply(`❌ Terjadi kesalahan: ${err.message || 'Unknown error'}`);
    }
  }
};
