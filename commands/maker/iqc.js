/**
 * Command: iqc / iphonequoted
 * iPhone Quoted Chat - Membuat gambar kutipan chat gaya iPhone
 */

const neoxr = require('../../lib/neoxr');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'iqc',
  aliases: ['iphonequoted', 'iphoneqc', 'iosquote', 'iquote'],
  category: 'maker',
  description: 'Buat gambar quoted chat gaya iPhone',
  usage: '<teks> atau balas pesan seseorang',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    // Ambil teks: dari argumen, atau dari pesan yang dibalas
    let text = args.join(' ').trim();
    let name = m.pushName || 'User';
    let avatar = '';

    // Jika membalas pesan orang lain, gunakan teks & nama mereka
    if (m.quoted) {
      if (!text && m.quoted.text) {
        text = m.quoted.text.trim();
      }
      // Ambil nama pengirim pesan yang dibalas
      const quotedSender = m.quoted.sender;
      if (quotedSender) {
        try {
          const jid = quotedSender.includes('@') ? quotedSender : quotedSender + '@s.whatsapp.net';
          name = m.quoted.senderNumber || 'User';
          // Coba ambil foto profil
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
      const res = await neoxr.iqc(text, name, avatar);

      if (!res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res.msg || 'Gagal membuat iPhone Quoted Chat.'}`);
      }

      const imgUrl = res.data.url;
      if (!imgUrl) {
        await m.react('❌');
        return m.reply('❌ URL gambar tidak ditemukan dalam respon API.');
      }

      const buffer = await neoxr.getBuffer(imgUrl);

      await sock.sendMessage(m.chat, {
        image: buffer,
        caption: `📱 *iPhone Quoted Chat*\n\n_${config.footer}_`
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      error(`[IQC ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat membuat iPhone Quoted Chat: ${err.message}`);
    }
  }
};
