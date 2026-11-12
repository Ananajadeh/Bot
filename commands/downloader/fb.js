/**
 * Command: fb / facebook / fbdl
 * Downloader Video & Reels Facebook menggunakan API Neoxr
 * API: https://api.neoxr.eu/api/fb
 */

const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'fb',
  aliases: ['facebook', 'fbdl', 'facebookdl', 'fbdown', 'fbvideo'],
  category: 'downloader',
  description: 'Download video atau reels dari Facebook dengan kualitas HD/SD',
  usage: '<url facebook>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    // Ambil URL dari argumen atau dari pesan yang dibalas
    let url = args[0];
    if (!url && m.quoted && m.quoted.text) {
      const match = m.quoted.text.match(/https?:\/\/(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch|fb\.com)\/[^\s]+/i);
      if (match) url = match[0];
    }

    if (!url || !url.match(/(?:facebook\.com|fb\.watch|fb\.com)/i)) {
      return m.reply(
        `⚠️ Masukkan URL video Facebook yang valid!\n\n` +
        `*Contoh:*\n\`${config.prefix}${command} https://www.facebook.com/share/r/176Gd2Y3F5/\`\n` +
        `_atau balas (reply) pesan yang berisi link Facebook._`
      );
    }

    await m.react('⏳');
    await m.reply(config.messages.wait || '⏳ Sedang mengunduh video Facebook, mohon tunggu sebentar...');

    try {
      const response = await axios.get('https://api.neoxr.eu/api/fb', {
        params: {
          url: url.trim(),
          apikey: config.neoxrApiKey
        },
        timeout: 60000
      });

      const res = response.data;
      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res?.msg || 'Gagal mengambil video Facebook. Pastikan video bersifat publik dan link masih aktif.'}`);
      }

      const data = res.data;
      let targetVideo = null;
      let qualityName = 'HD';

      if (Array.isArray(data) && data.length > 0) {
        // Prioritaskan kualitas HD / 720p / 1080p, fallback ke SD atau item pertama
        const hdItem = data.find((item) => /hd|720|1080/i.test(item.quality || ''));
        targetVideo = hdItem || data[0];
        qualityName = targetVideo.quality || 'Default';
      } else if (typeof data === 'object') {
        const videoUrl = data.url || data.video || data.hd || data.sd;
        if (videoUrl) {
          targetVideo = { url: videoUrl, quality: data.quality || (data.hd ? 'HD' : 'SD') };
          qualityName = targetVideo.quality;
        }
      }

      if (!targetVideo || !targetVideo.url) {
        await m.react('❌');
        return m.reply('❌ URL video Facebook tidak ditemukan dalam respon server.');
      }

      const caption =
        `🎬 *FACEBOOK DOWNLOADER* 🎬\n\n` +
        `◦ *Kualitas :* ${qualityName}\n` +
        `◦ *Status   :* Berhasil Diunduh ✅\n\n` +
        `_nayxilaa md_`;

      try {
        // Coba unduh buffer dengan IPv4 helper untuk performa terbaik
        const videoRes = await axios.get(targetVideo.url, {
          responseType: 'arraybuffer',
          httpAgent: new http.Agent({ family: 4 }),
          httpsAgent: new https.Agent({ family: 4 }),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': '*/*'
          },
          timeout: 120000
        });

        const videoBuffer = Buffer.from(videoRes.data);

        await sock.sendMessage(
          m.chat,
          {
            video: videoBuffer,
            caption
          },
          { quoted: m }
        );
      } catch (dlErr) {
        // Fallback kirim langsung via URL jika unduhan lokal timeout atau payload besar
        await sock.sendMessage(
          m.chat,
          {
            video: { url: targetVideo.url },
            caption
          },
          { quoted: m }
        );
      }

      await m.react('✅');
    } catch (err) {
      error(`Error Facebook Downloader: ${err.message}`);
      await m.react('❌');
      await m.reply(`❌ Gagal memproses video Facebook: ${err.message}`);
    }
  }
};
