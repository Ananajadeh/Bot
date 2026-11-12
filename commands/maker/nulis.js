/**
 * Command: nulis / tulis / handwriting
 * Nulis - Generator tulisan tangan di kertas
 */

const neoxr = require('../../lib/neoxr');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'nulis',
  aliases: ['tulis', 'handwriting', 'tulisan'],
  category: 'maker',
  description: 'Buat gambar tulisan tangan di atas kertas',
  usage: '<teks>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    let text = args.join(' ').trim();
    if (!text && m.quoted && m.quoted.text) {
      text = m.quoted.text.trim();
    }

    if (!text) {
      return m.reply(
        `⚠️ Masukkan teks yang ingin ditulis!\n\n*Contoh:*\n\`${config.prefix}${command} Halo, ini tulisan tangan digital\`\natau balas pesan teks dengan \`${config.prefix}${command}\``
      );
    }

    await m.react('⏳');

    try {
      const res = await neoxr.nulis(text);

      if (!res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res.msg || 'Gagal membuat tulisan tangan.'}`);
      }

      const imgUrl = res.data.url;
      if (!imgUrl) {
        await m.react('❌');
        return m.reply('❌ URL gambar tidak ditemukan dalam respon API.');
      }

      const buffer = await neoxr.getBuffer(imgUrl);

      await sock.sendMessage(m.chat, {
        image: buffer,
        caption: `📝 *NULIS - Tulisan Tangan*\n\n_${config.footer}_`
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      error(`[NULIS ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat membuat tulisan: ${err.message}`);
    }
  }
};
