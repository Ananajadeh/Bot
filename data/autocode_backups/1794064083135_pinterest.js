/**
 * Command: pinterest
 * Download media Pinterest atau cari gambar berdasarkan kata kunci (Neoxr API & Direct Scraper)
 */

const axios = require('axios');
const config = require('../../config');

async function resolveShortLink(url) {
  try {
    const res = await axios.get(url, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 300 && status < 400,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });
    return res.headers.location || url;
  } catch (err) {
    if (err.response && err.response.headers && err.response.headers.location) {
      return err.response.headers.location;
    }
    return url;
  }
}

async function extractOriginalImage(pinUrl) {
  const finalUrl = await resolveShortLink(pinUrl);

  const response = await axios.get(finalUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
    },
    timeout: 20000
  });

  const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

  // Cari video jika ada
  const videoMatch = html.match(/https:\/\/[^"'\s]+\.mp4/i);
  if (videoMatch) {
    return { url: videoMatch[0], isVideo: true };
  }

  // Cari gambar resolusi asli
  const originMatch = html.match(/https:\/\/i\.pinimg\.com\/originals\/[a-zA-Z0-9_\-\.\/]+/i);
  if (originMatch) {
    return { url: originMatch[0], isVideo: false };
  }

  // Fallback ke resolusi 736x
  const match736 = html.match(/https:\/\/i\.pinimg\.com\/736x\/[a-zA-Z0-9_\-\.\/]+/i);
  if (match736) {
    return { url: match736[0], isVideo: false };
  }

  return null;
}

module.exports = {
  name: 'pinterest',
  aliases: ['pin', 'pindl', 'pinsearch'],
  category: 'downloader',
  description: 'Download media Pinterest atau cari gambar berdasarkan kata kunci',
  usage: '<url pinterest / kata kunci>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, text, command }) => {
    const input = (text || '').trim();

    if (!input) {
      return m.reply(
        `📌 *PINTEREST DOWNLOADER & SEARCH* 📌\n\n` +
        `• *Download Pin:* \`.pinterest <link>\`\n` +
        `  Contoh: \`.pinterest https://pin.it/xxx\`\n\n` +
        `• *Cari Gambar:* \`.pinterest <kata kunci>\`\n` +
        `  Contoh: \`.pinterest aesthetic anime wallpaper\``
      );
    }

    await m.react('⏳');

    const isUrl = input.includes('pinterest.com') || input.includes('pin.it');

    if (isUrl) {
      // 1. Mode Download Tautan Pinterest
      try {
        let mediaUrl = null;
        let isVideo = false;

        // Coba via Neoxr API terlebih dahulu
        try {
          const res = await axios.get('https://api.neoxr.eu/api/pin', {
            params: { url: input, apikey: config.neoxrApiKey },
            timeout: 15000
          });
          if (res.data?.status && res.data?.data) {
            mediaUrl = res.data.data.url || res.data.data.download;
            isVideo = Boolean(res.data.data.type?.includes('video') || (mediaUrl && mediaUrl.includes('.mp4')));
          }
        } catch {}

        // Fallback ke direct extraction jika API Neoxr belum mendapatkan data
        if (!mediaUrl) {
          const direct = await extractOriginalImage(input);
          if (direct) {
            mediaUrl = direct.url;
            isVideo = direct.isVideo;
          }
        }

        if (!mediaUrl) {
          await m.react('❌');
          return m.reply('❌ Gagal mengekstrak media dari tautan Pinterest tersebut. Pastikan link mengarah ke Pin gambar atau video yang valid.');
        }

        await m.react('✅');
        if (isVideo) {
          await sock.sendMessage(m.chat, {
            video: { url: mediaUrl },
            caption: `📌 *Pinterest Video Downloader*\n\n📎 *Sumber:* ${input}`
          }, { quoted: m });
        } else {
          await sock.sendMessage(m.chat, {
            image: { url: mediaUrl },
            caption: `📌 *Pinterest Image Downloader*\n\n📎 *Sumber:* ${input}`
          }, { quoted: m });
        }
      } catch (err) {
        await m.react('❌');
        await m.reply(`❌ Terjadi kesalahan saat mengunduh Pinterest: ${err.message}`);
      }
    } else {
      // 2. Mode Pencarian Gambar Pinterest
      try {
        const res = await axios.get('https://api.neoxr.eu/api/pinterest', {
          params: { q: input, apikey: config.neoxrApiKey },
          timeout: 20000
        });

        if (!res.data?.status || !Array.isArray(res.data?.data) || res.data.data.length === 0) {
          await m.react('❌');
          return m.reply(`❌ Tidak ditemukan gambar untuk pencarian *"${input}"*.`);
        }

        const images = res.data.data.filter((u) => typeof u === 'string' && u.startsWith('http'));
        if (images.length === 0) {
          await m.react('❌');
          return m.reply(`❌ Gagal memproses gambar untuk *"${input}"*.`);
        }

        // Ambil gambar acak dari hasil
        const randomImage = images[Math.floor(Math.random() * images.length)];

        await m.react('✅');
        await sock.sendMessage(m.chat, {
          image: { url: randomImage },
          caption: `📌 *Hasil Pencarian Pinterest:*\n"${input}"\n\n_💡 Ketik lagi \`.pinterest ${input}\` untuk mendapatkan variasi gambar lainnya._`
        }, { quoted: m });
      } catch (err) {
        await m.react('❌');
        await m.reply(`❌ Gagal mencari di Pinterest: ${err.message}`);
      }
    }
  }
};
