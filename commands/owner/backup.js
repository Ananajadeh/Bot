/**
 * Command: backup
 * Mengompres proyek menjadi file .zip dan mengirimkannya langsung ke WhatsApp Owner
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('../../config');

module.exports = {
  name: 'backup',
  aliases: ['backupscript', 'downloadproyek'],
  category: 'owner',
  description: 'Download/backup seluruh script proyek ke file .zip via WhatsApp',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ sock, m }) => {
    await m.react('⏳');
    await m.reply('📦 *Sedang menyiapkan file zip proyek...* Mohon tunggu sebentar.');

    const projectDir = path.resolve(__dirname, '../../');
    const zipPath = '/sdcard/Download/nayxilaa-md.zip';

    try {
      // Buat file zip menggunakan python zipfile (mengecualikan node_modules)
      const pythonScript = `
import os, zipfile

src = '${projectDir}'
out = '${zipPath}'

with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(src):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for f in files:
            p = os.path.join(root, f)
            arc = os.path.relpath(p, src)
            z.write(p, arc)
`;
      execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`);

      if (!fs.existsSync(zipPath)) {
        throw new Error('Gagal membuat file zip backup.');
      }

      const fileBuffer = fs.readFileSync(zipPath);
      const sizeKB = Math.round(fileBuffer.length / 1024);

      await sock.sendMessage(m.chat, {
        document: fileBuffer,
        mimetype: 'application/zip',
        fileName: `nayxilaa-md-${new Date().toISOString().slice(0, 10)}.zip`,
        caption:
          `📦 *BACKUP PROYEK BERHASIL!*\n\n` +
          `• 📁 Nama File : \`nayxilaa-md.zip\`\n` +
          `• 📊 Ukuran    : *${sizeKB} KB*\n` +
          `• 📅 Tanggal   : *${new Date().toLocaleDateString('id-ID')}*\n` +
          `• 💾 Tersimpan : Di memori HP folder *Download*\n\n` +
          `_File backup siap diekstrak & dijalankan kembali dengan \`npm install\`._`
      }, { quoted: m });

      await m.react('✅');
    } catch (err) {
      await m.react('❌');
      return m.reply(`❌ *Gagal membuat backup:* ${err.message}`);
    }
  }
};
