const axios = require('axios');

module.exports = {
  name: 'pinterest',
  aliases: ['pin', 'pindl'],
  category: 'downloader',
  description: 'Download media (gambar/video) dari Pinterest via URL',
  usage: '<url pinterest>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, text, command, groupMetadata, isOwner, isAdmin, isBotAdmin, user }) => {
    try {
      const url = text ? text.trim() : '';

      if (!url) {
        return m.reply('📌 *Pinterest Downloader*\n\nKirim URL Pinterest yang ingin didownload.\n\nContoh:\n.pinterest https://id.pinterest.com/pin/237072367881744903/');
      }

      if (!/^https?:\/\//i.test(url)) {
        return m.reply('❌ URL tidak valid. Pastikan diawali dengan http:// atau https://');
      }

      await m.react('⏳');

      const apiUrl = 'https://api.neoxr.eu/api/pin?url=' + encodeURIComponent(url) + '&apikey=Anan270506';
      const { data } = await axios.get(apiUrl, { timeout: 60000 });

      if (!data || data.status === false) {
        await m.react('❌');
        return m.reply('❌ Gagal mengambil data dari Pinterest. Pastikan URL valid dan publik.');
      }

      const result = data.data || {};
      const title = result.title || result.desc || 'Pinterest Media';
      const medias = [];

      if (Array.isArray(result.media)) {
        for (const item of result.media) {
          if (item && item.url) {
            medias.push({ url: item.url, type: item.type || 'image' });
          }
        }
      } else if (result.url) {
        medias.push({ url: result.url, type: result.type || 'image' });
      }

      if (medias.length === 0) {
        await m.react('❌');
        return m.reply('❌ Media tidak ditemukan pada URL tersebut.');
      }

      const caption = '📌 *Pinterest Downloader*\n\n📝 ' + title + '\n🔗 ' + url;

      for (let i = 0; i < medias.length; i++) {
        const media = medias[i];
        const isVideo = /video/i.test(media.type) || /\.(mp4|mov|webm)(\?|$)/i.test(media.url);

        try {
          if (isVideo) {
            await sock.sendMessage(
              m.chat,
              {
                video: { url: media.url },
                caption: i === 0 ? caption : '',
                mimetype: 'video/mp4'
              },
              { quoted: m }
            );
          } else {
            await sock.sendMessage(
              m.chat,
              {
                image: { url: media.url },
                caption: i === 0 ? caption : ''
              },
              { quoted: m }
            );
          }
        } catch (sendErr) {
          await m.reply('⚠️ Gagal mengirim media ke-' + (i + 1) + ': ' + sendErr.message);
        }
      }

      await m.react('✅');
    } catch (error) {
      await m.react('❌');
      return m.reply('❌ Terjadi kesalahan: ' + error.message);
    }
  }
};
