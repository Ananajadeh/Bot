/**
 * Command: pinterest / pin / pindl / pinterestdl
 * Downloader Pinterest (Foto & Video) menggunakan Neoxr API
 * API: https://api.neoxr.eu/api/pin
 */

const axios = require('axios');
const neoxr = require('../../lib/neoxr');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'pinterest',
  aliases: ['pin', 'pindl', 'pinterestdl', 'pindownload'],
  category: 'downloader',
  description: 'Download foto atau video dari tautan Pinterest',
  usage: '<url pinterest>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    // Ambil URL dari argumen pertama atau pesan yang dibalas
    let url = args[0];
    if (!url && m.quoted && m.quoted.text) {
      const match = m.quoted.text.match(/https?:\/\/(?:[a-zA-Z0-9-]+\.)?(?:pinterest\.com|pin\.it)\/[^\s]+/i);
      if (match) url = match[0];
    }

    if (!url || !url.match(/(?:pinterest\.com|pin\.it)/i)) {
      return m.reply(
        `⚠️ Masukkan URL Pinterest yang valid!\n\n` +
        `*Contoh:*\n` +
        `\`${config.prefix}${command} https://id.pinterest.com/pin/237072367881744903/\`\n` +
        `\`${config.prefix}${command} https://pin.it/xxxxxxx\`\n\n` +
        `_Atau balas (reply) pesan berisi tautan Pinterest dengan perintah ini._`
      );
    }

    await m.react('⏳');
    await m.reply(config.messages.wait);

    try {
      // Panggil API Neoxr Downloader Pinterest
      const response = await axios.get('https://api.neoxr.eu/api/pin', {
        params: {
          url,
          apikey: config.neoxrApiKey
        },
        timeout: 60000
      });

      const res = response.data;

      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res?.msg || 'Gagal mengambil media dari Pinterest. Pastikan tautan masih aktif.'}`);
      }

      // Normalisasi format data respon (bisa berupa array objek, single objek, atau string URL)
      let mediaList = [];
      if (Array.isArray(res.data)) {
        mediaList = res.data;
      } else if (typeof res.data === 'object' && res.data !== null) {
        if (Array.isArray(res.data.url)) {
          mediaList = res.data.url;
        } else if (res.data.url) {
          mediaList = [res.data];
        } else {
          mediaList = [res.data];
        }
      } else if (typeof res.data === 'string') {
        mediaList = [{ url: res.data }];
      }

      if (mediaList.length === 0) {
        await m.react('❌');
        return m.reply('❌ Tidak ada file media yang ditemukan pada tautan tersebut.');
      }

      let sentCount = 0;
      // Batasi maksimal 5 media agar tidak flooding jika carousel terlalu banyak
      const maxItems = Math.min(mediaList.length, 5);

      for (let i = 0; i < maxItems; i++) {
        const item = mediaList[i];
        const mediaUrl = typeof item === 'object' && item !== null ? (item.url || item.download_url || item) : item;
        if (!mediaUrl || typeof mediaUrl !== 'string') continue;

        // Unduh buffer sekaligus deteksi otomatis video / image
        const { buffer, contentType, isVideo: detectedVideo } = await neoxr.getMediaBuffer(mediaUrl);

        const isVideo =
          detectedVideo ||
          /\.(mp4|mov|webm)(\?.*)?$/i.test(mediaUrl) ||
          (contentType && contentType.startsWith('video/'));

        const caption =
          `📌 *PINTEREST DOWNLOADER*` +
          (maxItems > 1 ? ` (${i + 1}/${maxItems})` : '') +
          `\n\n_${config.footer}_`;

        if (isVideo) {
          await sock.sendMessage(
            m.chat,
            {
              video: buffer,
              caption,
              mimetype: 'video/mp4'
            },
            { quoted: m }
          );
        } else {
          await sock.sendMessage(
            m.chat,
            {
              image: buffer,
              caption,
              mimetype: (contentType && contentType.startsWith('image/')) ? contentType : 'image/jpeg'
            },
            { quoted: m }
          );
        }

        sentCount++;
      }

      if (sentCount > 0) {
        await m.react('✅');
      } else {
        await m.react('❌');
        await m.reply('❌ Gagal memproses file media Pinterest.');
      }
    } catch (err) {
      error(`[PINTEREST ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Gagal download Pinterest: ${err.response?.data?.msg || err.message}`);
    }
  }
};
