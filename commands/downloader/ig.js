/**
 * Command: instagram / ig / reels / igdl
 * Download Postingan, Reels & Story Instagram
 */

const neoxr = require('../../lib/neoxr');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'instagram',
  aliases: ['ig', 'igdl', 'reels', 'igstory'],
  category: 'downloader',
  description: 'Download Reels, Video, atau Foto Instagram',
  usage: '<url instagram>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    // Ambil URL dari argumen atau dari pesan yang dibalas
    let url = args[0];
    if (!url && m.quoted && m.quoted.text) {
      const match = m.quoted.text.match(/https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/[^\s]+/i);
      if (match) url = match[0];
    }

    if (!url || !url.match(/(?:instagram\.com|instagr\.am)/i)) {
      return m.reply(
        `⚠️ Masukkan URL Instagram yang valid!\n\n*Contoh:*\n\`${config.prefix}${command} https://www.instagram.com/reel/xxxx/\`\natau balas pesan yang berisi link Instagram.`
      );
    }

    await m.react('⏳');
    await m.reply(config.messages.wait);

    try {
      let res = null;

      // Cek apakah berupa URL Instagram Stories
      const storiesMatch = url.match(/instagram\.com\/stories\/([a-zA-Z0-9_.-]+)/i);

      try {
        res = await neoxr.ig(url);
      } catch (err) {
        // Jika endpoint /ig gagal dan merupakan stories, coba fallback ke /igs
        if (storiesMatch && storiesMatch[1]) {
          try {
            res = await neoxr.igs(storiesMatch[1]);
          } catch {
            throw err;
          }
        } else {
          throw err;
        }
      }

      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res?.msg || 'Gagal mengambil media Instagram. Pastikan akun tidak diprivat dan postingan masih aktif.'}`);
      }

      // Normalisasi format response data (array, single object, atau list bertingkat)
      let mediaList = [];
      if (Array.isArray(res.data)) {
        mediaList = res.data;
      } else if (typeof res.data === 'object' && res.data !== null) {
        if (Array.isArray(res.data.data)) {
          mediaList = res.data.data;
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
        return m.reply('❌ Tidak ada media yang ditemukan dari link tersebut.');
      }

      let sentCount = 0;

      for (let i = 0; i < mediaList.length; i++) {
        const item = mediaList[i];
        const mediaUrl = typeof item === 'object' && item !== null ? (item.url || item.download_url || item) : item;
        if (!mediaUrl || typeof mediaUrl !== 'string') continue;

        const itemType = typeof item === 'object' && item !== null ? String(item.type || '').toLowerCase() : '';

        // Unduh media buffer sekaligus mendeteksi secara presisi mime-type dan magic bytes file
        const { buffer, contentType, isVideo: detectedVideo } = await neoxr.getMediaBuffer(mediaUrl);

        // Validasi ganda apakah media adalah video:
        // 1. Deteksi magic bytes (ftyp) & Content-Type video/*
        // 2. Tipe 'mp4', 'video' dari respon API
        // 3. Ekstensi URL
        const isVideo =
          detectedVideo ||
          itemType === 'video' ||
          itemType === 'mp4' ||
          itemType.includes('video') ||
          itemType.includes('mp4') ||
          /\.(mp4|mov|webm)(\?.*)?$/i.test(mediaUrl);

        const caption =
          `📸 *INSTAGRAM DOWNLOADER* (${i + 1}/${mediaList.length})\n\n` +
          `_${config.footer}_`;

        if (isVideo) {
          await sock.sendMessage(m.chat, {
            video: buffer,
            caption,
            mimetype: 'video/mp4'
          }, { quoted: m });
        } else {
          await sock.sendMessage(m.chat, {
            image: buffer,
            caption,
            mimetype: (contentType && contentType.startsWith('image/')) ? contentType : 'image/jpeg'
          }, { quoted: m });
        }

        sentCount++;
      }

      if (sentCount > 0) {
        await m.react('✅');
      } else {
        await m.react('❌');
        await m.reply('❌ Gagal memproses file media dari Instagram.');
      }
    } catch (err) {
      error(`[IG ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Gagal download Instagram: ${err.message || 'Terjadi kesalahan pada server downloader.'}`);
    }
  }
};
