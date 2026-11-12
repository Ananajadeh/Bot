/**
 * Command: listcode
 * Menampilkan daftar seluruh file command yang terdaftar di dalam bot.
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config');
const { listAllCommandFiles, PROJECT_ROOT } = require('../../lib/autoCoder');

module.exports = {
  name: 'listcode',
  aliases: ['filelist', 'files', 'lsdir'],
  category: 'owner',
  description: 'Melihat daftar seluruh file kode command bot',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m }) => {
    const files = listAllCommandFiles();

    if (!files.length) {
      return m.reply('⚠️ Tidak ada file command yang ditemukan.');
    }

    // Kelompokkan file berdasarkan kategori (nama folder)
    const categorized = {};
    for (const f of files) {
      const rel = path.relative(PROJECT_ROOT, f);
      const parts = rel.split(path.sep);
      const cat = parts.length > 2 ? parts[1] : 'root';

      if (!categorized[cat]) {
        categorized[cat] = [];
      }

      const stat = fs.statSync(f);
      const sizeKb = (stat.size / 1024).toFixed(1);
      categorized[cat].push({
        name: path.basename(f),
        relPath: rel,
        size: `${sizeKb} KB`
      });
    }

    let out = `📁 *DAFTAR FILE COMMAND BOT (${files.length} FILE)* 📁\n\n`;

    for (const [cat, list] of Object.entries(categorized)) {
      out += `📂 *Kategori: ${cat.toUpperCase()}* (${list.length} file)\n`;
      for (const item of list) {
        out += `  • \`${item.name}\` (${item.size})\n`;
      }
      out += '\n';
    }

    out += `_💡 Gunakan \`${config.prefix}readcode <nama>\` untuk melihat isi kode._\n`;
    out += `_💡 Gunakan \`${config.prefix}autocode edit <nama> ...\` untuk mengubah kode._`;

    await m.reply(out);
  }
};
