/**
 * Command: waqc / quotely / waquote / whatsappquote
 * WhatsApp Web Quoted Chat - Membuat gambar quoted chat gaya WhatsApp Web
 */

const neoxr = require('../../lib/neoxr');
const { createSticker } = require('../../lib/sticker');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'waqc',
  aliases: ['quotely', 'waquote', 'whatsappquote', 'qc', 'quote'],
  category: 'maker',
  description: 'Buat gambar/stiker quoted chat gaya WhatsApp Web',
  usage: '<teks> atau balas pesan seseorang',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    let text = args.join(' ').trim();
    let name = m.pushName || 'User';
    let avatar = '';

    // Jika membalas pesan orang lain, gunakan teks & nama mereka
    if (m.quoted) {
      if (!text && m.quoted.text) {
        text = m.quoted.text.trim();
      }
      const quotedSender = m.quoted.sender;
      if (quotedSender) {
        try {
          const jid = quotedSender.includes('@') ? quotedSender : quotedSender + '@s.whatsapp.net';
          name = m.quoted.senderNumber || 'User';
          try {
            avatar = await sock.profilePictureUrl(jid, 'image').catch(() => '');
          } catch {}
        } catch {}
      }
    }

    if (!text) {
      return m.reply(
        `⚠️ Masukkan teks atau balas pesan seseorang!\n\n*Contoh:*\n\`${config.prefix}${command} Halo dunia\`\natau balas pesan dengan \`${config.prefix}${command}\``
      );
    }

    await m.react('⏳');

    try {
      const res = await neoxr.quotely(text, name, avatar);

      if (!res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res.msg || 'Gagal membuat WhatsApp Quoted Chat.'}`);
      }

      const buffer = res.data.buffer || (res.data.url ? await neoxr.getBuffer(res.data.url) : null);
      if (!buffer) {
        await m.react('❌');
        return m.reply('❌ Gagal menghasilkan gambar quoted chat.');
      }

      // Konversi ke stiker
      const stickerBuffer = await createSticker(buffer, {
        packname: config.botName,
        author: config.ownerName,
        isVideo: false
      });

      await sock.sendMessage(m.chat, {
        sticker: stickerBuffer
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      error(`[WAQC ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat membuat WhatsApp Quoted Chat: ${err.message}`);
    }
  }
};
