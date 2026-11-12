/**
 * Command: readcode
 * Membaca dan menampilkan isi kode file command bot.
 */

const fs = require('fs');
const path = require('path');
const { findCommandFile, PROJECT_ROOT } = require('../../lib/autoCoder');

module.exports = {
  name: 'readcode',
  aliases: ['catcode', 'viewcode', 'getcode'],
  category: 'owner',
  description: 'Melihat isi kode file command bot',
  usage: '<nama_command / path_file>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m, text }) => {
    if (!text) {
      return m.reply('⚠️ Masukkan nama command atau path file yang ingin dibaca!\nContoh: `.readcode ping` atau `.readcode commands/ai/ai.js`');
    }

    const file = findCommandFile(text.trim());
    if (!file || !fs.existsSync(file)) {
      return m.reply(`❌ File atau command '${text}' tidak ditemukan di sistem.`);
    }

    try {
      const content = fs.readFileSync(file, 'utf-8');
      const relPath = path.relative(PROJECT_ROOT, file);

      if (content.length > 3500) {
        // Jika file terlalu panjang untuk chat biasa, kirimkan potongan atau peringatan
        const preview = content.substring(0, 3000);
        return m.reply(
          `📄 *FILE: ${relPath}* (Ukuran: ${content.length} karakter - Dipotong)\n\n` +
          `\`\`\`javascript\n${preview}\n\n// ... [dipotong karena melebihi 3000 karakter]\`\`\``
        );
      }

      await m.reply(
        `📄 *FILE: ${relPath}*\n\n` +
        `\`\`\`javascript\n${content}\n\`\`\``
      );
    } catch (err) {
      m.reply(`❌ Gagal membaca file: ${err.message}`);
    }
  }
};
