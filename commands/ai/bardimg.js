/**
 * Command: bardimg / bardimage / aiimg / aiimage
 * Google Bard AI (Image Generator) menggunakan API Neoxr
 * API: https://api.neoxr.eu/api/bardimg
 */

const axios = require('axios');
const neoxr = require('../../lib/neoxr');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'bardimg',
  aliases: ['bardimage', 'aiimg', 'aiimage', 'generateimg', 'bardfoto'],
  category: 'ai',
  description: 'Generate gambar AI dari teks menggunakan Google Bard AI',
  usage: '<prompt / deskripsi gambar>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, text, command }) => {
    // Ambil prompt dari argumen teks atau pesan yang di-reply
    let prompt = text;
    if (!prompt && m.quoted && m.quoted.text) {
      prompt = m.quoted.text;
    }

    if (!prompt) {
      return m.reply(
        `🎨 *Google Bard AI (Image Generator)*\n\n` +
        `Ketik: \`${config.prefix}${command} <deskripsi gambar>\`\n` +
        `Atau balas (reply) pesan berisi teks dengan: \`${config.prefix}${command}\`\n\n` +
        `*Contoh:*\n` +
        `\`${config.prefix}${command} A soft 3D clay-style illustration of a cute orange cat sitting holding a cup of coffee\`\n` +
        `\`${config.prefix}${command} futuristic cyberpunk city at night with neon lights 8k cinematic\``
      );
    }

    await m.react('⏳');
    await m.reply(config.messages.wait);

    try {
      // Panggil API Neoxr bardimg
      const response = await axios.get('https://api.neoxr.eu/api/bardimg', {
        params: {
          q: prompt,
          apikey: config.neoxrApiKey
        },
        timeout: 90000
      });

      const res = response.data;

      if (!res || !res.status || !res.data || !res.data.url) {
        await m.react('❌');
        return m.reply(`❌ ${res?.msg || 'Gagal menghasilkan gambar dengan Bard AI. Coba gunakan prompt lain.'}`);
      }

      const imgUrl = res.data.url;

      // Unduh buffer gambar
      const imgBuffer = await neoxr.getBuffer(imgUrl);

      // Kirim gambar ke WhatsApp
      await sock.sendMessage(
        m.chat,
        {
          image: imgBuffer,
          caption:
            `🎨 *GOOGLE BARD AI IMAGE GENERATOR*\n\n` +
            `◦ *Prompt :* ${prompt}\n` +
            `◦ *Ukuran :* ${res.data.size || 'HD'}\n\n` +
            `_${config.footer}_`
        },
        { quoted: m }
      );

      await m.react('✨');
    } catch (err) {
      error(`[BARDIMG ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat membuat gambar AI: ${err.response?.data?.msg || err.message}`);
    }
  }
};
