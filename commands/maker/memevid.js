/**
 * Command: memevid / memeanimated / memegif
 * Meme Generator Animated - Buat meme animasi (video/GIF) dari gambar atau video
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'memevid',
  aliases: ['memeanimated', 'memegif', 'memeanim'],
  category: 'maker',
  description: 'Buat meme animasi (video/GIF) dengan teks atas & bawah',
  usage: '<teks atas> | <teks bawah> (kirim/balas gambar atau video)',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    // Cek apakah ada media gambar atau video yang dikirim atau dibalas
    const isQuotedMedia = m.quoted && (m.quoted.type === 'imageMessage' || m.quoted.type === 'videoMessage');
    const isDirectMedia = m.type === 'imageMessage' || m.type === 'videoMessage';

    if (!isQuotedMedia && !isDirectMedia) {
      return m.reply(
        `⚠️ Kirim atau balas gambar/video dengan perintah ini!\n\n*Format:*\n\`${config.prefix}${command} teks atas | teks bawah\`\n\n*Contoh:*\n\`${config.prefix}${command} POV: kamu buka WA | Dan ada 999 chat\``
      );
    }

    const text = args.join(' ').trim();
    if (!text) {
      return m.reply(
        `⚠️ Masukkan teks meme!\n\n*Format:*\n\`${config.prefix}${command} teks atas | teks bawah\`\n\n*Contoh:*\n\`${config.prefix}${command} POV: kamu buka WA | Dan ada 999 chat\``
      );
    }

    let top = text;
    let bottom = '';
    if (text.includes('|')) {
      const parts = text.split('|');
      top = parts[0].trim();
      bottom = parts.slice(1).join('|').trim();
    }

    await m.react('⏳');

    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tmpTop = path.join(os.tmpdir(), `meme_top_${id}.txt`);
    const tmpBot = path.join(os.tmpdir(), `meme_bot_${id}.txt`);
    const isVideo = (m.quoted?.type === 'videoMessage') || (m.type === 'videoMessage');
    const tmpIn = path.join(os.tmpdir(), `meme_in_${id}.${isVideo ? 'mp4' : 'jpg'}`);
    const tmpOut = path.join(os.tmpdir(), `meme_out_${id}.mp4`);

    try {
      const mediaBuffer = await m.download();
      if (!mediaBuffer || mediaBuffer.length === 0) {
        await m.react('❌');
        return m.reply('❌ Gagal mengunduh media. Silakan coba kirim ulang.');
      }

      await fs.promises.writeFile(tmpIn, mediaBuffer);
      await fs.promises.writeFile(tmpTop, top);
      await fs.promises.writeFile(tmpBot, bottom);

      // Siapkan filter drawtext FFmpeg menggunakan textfile agar bebas karakter khusus/kutip
      const drawFilters = [];
      if (top) {
        drawFilters.push(`drawtext=textfile='${tmpTop}':expansion=none:fontcolor=white:fontsize=32:borderw=3:bordercolor=black:x=(w-text_w)/2:y=25`);
      }
      if (bottom) {
        drawFilters.push(`drawtext=textfile='${tmpBot}':expansion=none:fontcolor=white:fontsize=32:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-text_h-25`);
      }

      const drawFilterStr = drawFilters.length > 0 ? ',' + drawFilters.join(',') : '';

      let ffmpegCmd = '';
      if (isVideo) {
        ffmpegCmd = `ffmpeg -y -i "${tmpIn}" -t 10 -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black${drawFilterStr}" -c:v libx264 -pix_fmt yuv420p -an "${tmpOut}"`;
      } else {
        ffmpegCmd = `ffmpeg -y -loop 1 -i "${tmpIn}" -t 3 -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black${drawFilterStr}" -c:v libx264 -pix_fmt yuv420p -an "${tmpOut}"`;
      }

      await execAsync(ffmpegCmd);

      const vidBuffer = await fs.promises.readFile(tmpOut);

      await sock.sendMessage(m.chat, {
        video: vidBuffer,
        caption: `🎭 *MEME GENERATOR ANIMATED*\n\n_${config.footer}_`,
        gifPlayback: true,
        mimetype: 'video/mp4'
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      error(`[MEMEVID ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat membuat meme animasi: ${err.message}`);
    } finally {
      try { await fs.promises.unlink(tmpIn); } catch {}
      try { await fs.promises.unlink(tmpTop); } catch {}
      try { await fs.promises.unlink(tmpBot); } catch {}
      try { await fs.promises.unlink(tmpOut); } catch {}
    }
  }
};
