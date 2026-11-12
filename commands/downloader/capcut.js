/**
 * Command: capcut / cc / capcutdl
 * Downloader Video & Template CapCut No Watermark menggunakan API Neoxr
 * API: https://api.neoxr.eu/api/capcut
 */

const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'capcut',
  aliases: ['cc', 'capcutdl', 'ccdl', 'capcutvideo'],
  category: 'downloader',
  description: 'Download video dan template CapCut tanpa watermark',
  usage: '<url capcut>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    // Ambil URL dari argumen atau dari pesan yang dibalas
    let url = args[0];
    if (!url && m.quoted && m.quoted.text) {
      const match = m.quoted.text.match(/https?:\/\/(?:www\.)?(?:capcut\.(?:com|net)|mobile\.capcut\.com)\/[^\s]+/i);
      if (match) url = match[0];
    }

    if (!url || !url.match(/(?:capcut\.(?:com|net)|mobile\.capcut\.com)/i)) {
      return m.reply(
        `⚠️ Masukkan URL CapCut yang valid!\n\n` +
        `*Contoh:*\n\`${config.prefix}${command} https://www.capcut.com/t/xxxxxxx/\`\n` +
        `_atau balas (reply) pesan yang berisi tautan CapCut._`
      );
    }

    await m.react('⏳');
    await m.reply(config.messages.wait || '⏳ Sedang mengunduh video CapCut, mohon tunggu sebentar...');

    try {
      const response = await axios.get('https://api.neoxr.eu/api/capcut', {
        params: {
          url: url.trim(),
          apikey: config.neoxrApiKey
        },
        timeout: 60000
      });

      const res = response.data;
      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(
          `❌ ${res?.msg || 'Gagal memproses link CapCut. Pastikan template/video masih tersedia dan link tidak kedaluwarsa.'}`
        );
      }

      const data = res.data;
      const videoUrl =
        data.video ||
        data.url ||
        data.video_url ||
        data.play_url ||
        (Array.isArray(data) ? data[0]?.url || data[0] : null);

      if (!videoUrl) {
        await m.react('❌');
        return m.reply('❌ URL video CapCut tidak ditemukan dalam respon server.');
      }

      const title = data.title || data.caption || data.description || 'CapCut Video';
      const author = data.author?.name || data.author || data.creator || 'CapCut Creator';
      const usageCount = data.usage || data.use_count || data.play_count || '-';

      const caption =
        `🎬 *CAPCUT DOWNLOADER* 🎬\n\n` +
        `◦ *Judul   :* ${title}\n` +
        `◦ *Kreator :* ${author}\n` +
        (usageCount !== '-' ? `◦ *Dipakai :* ${usageCount} kali\n` : '') +
        `◦ *Status  :* Tanpa Watermark ✅\n\n` +
        `_nayxilaa md_`;

      try {
        // Coba unduh buffer langsung
        const videoRes = await axios.get(videoUrl, {
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
        // Fallback kirim via URL langsung
        await sock.sendMessage(
          m.chat,
          {
            video: { url: videoUrl },
            caption
          },
          { quoted: m }
        );
      }

      await m.react('✅');
    } catch (err) {
      error(`Error CapCut Downloader: ${err.message}`);
      await m.react('❌');
      await m.reply(`❌ Gagal mengunduh video CapCut: ${err.message}`);
    }
  }
};
