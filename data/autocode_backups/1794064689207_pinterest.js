const axios = require('axios');

module.exports = {
  name: 'pinterest',
  aliases: ['pin', 'pinterestdl'],
  category: 'downloader',
  description: 'Downloader Pinterest: unduh gambar dari URL Pin Pinterest',
  usage: '<url_pinterest>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, text, command, groupMetadata, isOwner, isAdmin, isBotAdmin, user }) => {
    try {
      const target = (text && text.trim()) ? text.trim() : (args && args.length ? args.join(' ').trim() : '');
      const pinterestRegex = /https?:\/\/(www\.)?pinterest\.com\/pin\/\d+/i;
      if (!target || !pinterestRegex.test(target)) {
        await m.reply('🔗 Gunakan URL Pinterest yang valid, contoh: https://www.pinterest.com/pin/123456789/');
        return;
      }

      await m.react('🔎');
      const { data: html } = await axios.get(target, { timeout: 15000 });

      let imageUrl = null;
      const ogMatch = html.match(/<meta[^>]+property=['"]og:image['"][^>]+content=['"]([^'\"]+)['"]/i);
      if (ogMatch && ogMatch[1]) imageUrl = ogMatch[1];
      if (!imageUrl) {
        const jsonLdMatch = html.match(/"image"\s*:\s*['"](https?:\/\/[^'"\s]+)['"]/i);
        if (jsonLdMatch && jsonLdMatch[1]) imageUrl = jsonLdMatch[1];
      }

      if (!imageUrl) {
        await m.reply('⚠️ Gagal mengambil gambar dari halaman Pinterest. Coba tautan lain.');
        return;
      }

      if (imageUrl.startsWith('http://')) imageUrl = imageUrl.replace('http://', 'https://');

      await sock.sendMessage(m.chat, { image: { url: imageUrl }, caption: '📌 Pinterest Pin: ' + target }, { quoted: m });
      await m.react('✅');
    } catch (err) {
      await m.reply('❌ Terjadi kesalahan saat mengunduh Pinterest. Pastikan URL publik dan bisa diakses.');
      console.error(err);
    }
  }
};