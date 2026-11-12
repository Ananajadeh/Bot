/**
 * Command: autocode
 * Fitur canggih Auto Coding langsung dari WhatsApp menggunakan AI Neoxr.
 * Mampu membuat fitur baru, mengedit/memodifikasi fitur yang sudah ada,
 * melakukan validasi sintaks, backup otomatis, dan hot-reload secara real-time.
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config');
const {
  findCommandFile,
  generateCodeWithNeoxr,
  applyCode,
  PROJECT_ROOT
} = require('../../lib/autoCoder');

module.exports = {
  name: 'autocode',
  aliases: ['acode', 'coding', 'autocoding', 'buatfitur', 'editfitur'],
  category: 'owner',
  description: 'Membuat atau mengedit fitur bot WhatsApp via AI Neoxr',
  usage: '<permintaan fitur / instruksi modifikasi>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ sock, m, args, text, command }) => {
    // 1. Ekstraksi instruksi dari teks atau quoted message
    let instruction = text ? text.trim() : '';

    if (m.quoted && m.quoted.text) {
      if (instruction) {
        instruction = `${instruction}\n\n[Referensi Pesan / Kode yang Dibalas]:\n${m.quoted.text}`;
      } else {
        instruction = m.quoted.text.trim();
      }
    }

    if (!instruction) {
      return m.reply(
        `🤖 *PANDUAN FITUR AUTO CODING AI (NEOXR)* 🤖\n\n` +
        `Fitur ini memungkinkan Anda menambah, mengedit, atau memodifikasi fitur bot WhatsApp secara instan!\n\n` +
        `📌 *1. Membuat Fitur Baru:*\n` +
        `• \`${config.prefix}autocode buatkan fitur tebak gambar di kategori game\`\n` +
        `• \`${config.prefix}autocode buat command cuaca BMKG di tools/cuaca.js\`\n` +
        `• \`${config.prefix}autocode buatkan fitur lirik lagu menggunakan axios\`\n\n` +
        `📌 *2. Mengedit / Memodifikasi Fitur Yang Sudah Ada:*\n` +
        `• \`${config.prefix}autocode edit ping tambahkan informasi ram dan cpu\`\n` +
        `• \`${config.prefix}autocode ubah commands/maker/brat.js agar teks maksimal 100 karakter\`\n` +
        `• \`${config.prefix}autocode perbaiki error ... (atau balas pesan error)\`\n\n` +
        `📌 *3. Perintah Pendukung:*\n` +
        `• \`${config.prefix}readcode <nama/path>\` : Lihat isi kode file\n` +
        `• \`${config.prefix}listcode\` : Daftar semua file command\n` +
        `• \`${config.prefix}delcode <nama/path>\` : Hapus command (dengan backup)\n` +
        `• \`${config.prefix}undocode\` : Batalkan / kembalikan perubahan terakhir\n` +
        `• \`${config.prefix}reload\` : Muat ulang semua command tanpa restart\n\n` +
        `_💡 Semua perubahan otomatis diverifikasi sintaksnya & di-backup sebelum disimpan._`
      );
    }

    await m.react('⏳');
    await m.reply(`⚡ *[AI AUTO-CODER DEEPSEEK]*\nSedang menganalisis instruksi & merancang kode menggunakan DeepSeek AI, mohon tunggu sebentar...`);

    try {
      // 2. Deteksi apakah instruksi meminta untuk mengedit file tertentu
      let targetFile = null;
      let currentCode = null;

      // Pola deteksi edit: "edit <target> <instruksi>" atau "ubah <target> <instruksi>"
      const editMatch = instruction.match(/^(?:edit|ubah|modifikasi|update|ganti)\s+([a-zA-Z0-9_\-\.\/]+)\s*([\s\S]*)$/i);
      if (editMatch) {
        const potentialTarget = editMatch[1];
        const remainingInst = editMatch[2];

        const foundFile = findCommandFile(potentialTarget);
        if (foundFile && fs.existsSync(foundFile)) {
          targetFile = path.relative(PROJECT_ROOT, foundFile);
          currentCode = fs.readFileSync(foundFile, 'utf-8');
          instruction = remainingInst || `Modifikasi file ${targetFile}`;
        }
      }

      // Jika belum terdeteksi dari pola edit, cek apakah ada path file eksplisit di dalam teks
      if (!currentCode) {
        const pathMatch = instruction.match(/(?:commands\/[a-zA-Z0-9_\-\.\/]+\.js)/i);
        if (pathMatch) {
          const potentialPath = pathMatch[0];
          const found = findCommandFile(potentialPath);
          if (found && fs.existsSync(found)) {
            targetFile = path.relative(PROJECT_ROOT, found);
            currentCode = fs.readFileSync(found, 'utf-8');
          } else {
            targetFile = potentialPath;
          }
        }
      }

      // 3. Generate kode dengan Neoxr AI
      const aiResult = await generateCodeWithNeoxr({
        instruction,
        targetFile,
        currentCode
      });

      if (!aiResult || !aiResult.code) {
        throw new Error('AI tidak menghasilkan kode yang valid.');
      }

      // 4. Terapkan kode, lakukan validasi sintaks & hot-reload
      const applyResult = await applyCode({
        targetFile: aiResult.targetFile || targetFile,
        code: aiResult.code,
        explanation: aiResult.explanation
      });

      await m.react('✅');

      // Siapkan potongan preview kode (maksimal 20 baris pertama)
      const codeLines = aiResult.code.split('\n');
      const previewCode = codeLines.slice(0, 15).join('\n') + (codeLines.length > 15 ? '\n// ... [kode dipotong]' : '');

      const responseMessage =
        `🎉 *AUTO CODING BERHASIL!* 🎉\n\n` +
        `📝 *Status:* ${applyResult.isEdit ? 'Modifikasi File (Update)' : 'Fitur Baru Dibuat (Create)'}\n` +
        `🧠 *Engine AI:* ${aiResult.modelUsed || 'Neoxr DeepSeek'}\n` +
        `📁 *File:* \`${applyResult.relativePath}\`\n` +
        `⚡ *Command:* \`${config.prefix}${applyResult.commandName}\`\n\n` +
        `📋 *Penjelasan AI:*\n${aiResult.explanation || 'Kode berhasil diterapkan dan diuji tanpa error.'}\n\n` +
        `💻 *Preview Kode:*\n\`\`\`javascript\n${previewCode}\n\`\`\`\n\n` +
        `✨ *Fitur sudah langsung aktif & bisa dites sekarang:* ketik \`${config.prefix}${applyResult.commandName}\`\n` +
        `_💡 Ingin membatalkan perubahan ini? Ketik: \`${config.prefix}undocode\`_`;

      await m.reply(responseMessage);

    } catch (err) {
      await m.react('❌');
      await m.reply(
        `❌ *AUTO CODING GAGAL!*\n\n` +
        `*Penyebab Error:* ${err.message}\n\n` +
        `_Sistem bot telah melakukan safe-rollback sehingga bot tetap berjalan normal._`
      );
    }
  }
};
