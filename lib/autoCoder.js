/**
 * AUTO CODER ENGINE - nayxilaa md
 * Modul kecerdasan buatan untuk membuat, mengubah, dan mengedit fitur bot WhatsApp
 * secara langsung melalui chat WhatsApp menggunakan AI Neoxr.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('../config');
const { loadCommands, getCommand, getAllCommands } = require('./loader');
const { info, warn, error } = require('./color');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const COMMANDS_DIR = path.join(PROJECT_ROOT, 'commands');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'data/autocode_backups');
const HISTORY_FILE = path.join(BACKUP_DIR, 'history.json');

// Pastikan direktori backup tersedia
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Axios client khusus Neoxr API
const neoxrClient = axios.create({
  baseURL: 'https://api.neoxr.eu/api',
  httpAgent: new http.Agent({ family: 4, keepAlive: true }),
  httpsAgent: new https.Agent({ family: 4, keepAlive: true }),
  timeout: 60000
});

/**
 * Validasi keamanan path agar tidak keluar dari PROJECT_ROOT dan tidak merusak data sensitif
 */
function isPathSafe(targetPath) {
  const normalized = path.resolve(PROJECT_ROOT, targetPath);
  if (!normalized.startsWith(PROJECT_ROOT)) return false;

  // Daftar direktori / file yang dilarang disentuh oleh auto coder
  const forbidden = [
    path.join(PROJECT_ROOT, 'session'),
    path.join(PROJECT_ROOT, '.git'),
    path.join(PROJECT_ROOT, 'node_modules'),
    path.join(PROJECT_ROOT, 'package-lock.json'),
    path.join(PROJECT_ROOT, 'yarn.lock')
  ];

  for (const f of forbidden) {
    if (normalized === f || normalized.startsWith(f + path.sep)) {
      return false;
    }
  }

  return true;
}

/**
 * Cari file command berdasarkan nama atau path parsial
 */
function findCommandFile(query) {
  if (!query) return null;
  const clean = query.trim().replace(/^(\.|\/)/, '');

  // 1. Cek jika query merupakan path langsung
  const directPath = path.resolve(PROJECT_ROOT, clean);
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return directPath;
  }

  // 2. Cek jika file ada di dalam commands/
  const cmdDirect = path.resolve(COMMANDS_DIR, clean.endsWith('.js') ? clean : `${clean}.js`);
  if (fs.existsSync(cmdDirect) && fs.statSync(cmdDirect).isFile()) {
    return cmdDirect;
  }

  // 3. Cari dari loader getCommand
  const cmd = getCommand(clean);
  if (cmd) {
    // Cari file di commands/
    const allFiles = listAllCommandFiles();
    for (const f of allFiles) {
      try {
        const loaded = require(f);
        if (loaded && (loaded.name === cmd.name || (loaded.aliases && loaded.aliases.includes(cmd.name)))) {
          return f;
        }
      } catch {}
    }
  }

  // 4. Pencarian fuzzy nama file di dalam commands/
  const searchName = clean.toLowerCase().replace(/\.js$/, '');
  const files = listAllCommandFiles();
  for (const f of files) {
    const base = path.basename(f, '.js').toLowerCase();
    if (base === searchName) {
      return f;
    }
  }

  return null;
}

/**
 * Ambil semua path file command .js di direktori commands/
 */
function listAllCommandFiles(dir = COMMANDS_DIR) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(listAllCommandFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Baca riwayat backup
 */
function getHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

/**
 * Simpan entri backup ke file history
 */
function saveHistory(history) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(-50), null, 2), 'utf-8');
  } catch (err) {
    warn(`Gagal menyimpan riwayat backup: ${err.message}`);
  }
}

/**
 * Backup file sebelum dilakukan perubahan atau penghapusan
 */
function backupFile(absPath, note = '') {
  if (!fs.existsSync(absPath)) return null;

  try {
    const timestamp = Date.now();
    const basename = path.basename(absPath);
    const backupName = `${timestamp}_${basename}`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    fs.copyFileSync(absPath, backupPath);

    const history = getHistory();
    const entry = {
      id: timestamp,
      originalPath: absPath,
      relativePath: path.relative(PROJECT_ROOT, absPath),
      backupPath,
      timestamp: new Date().toISOString(),
      note
    };

    history.push(entry);
    saveHistory(history);

    return entry;
  } catch (err) {
    error(`Gagal membuat backup ${absPath}: ${err.message}`);
    return null;
  }
}

/**
 * Rollback / Revert perubahan terakhir
 */
function rollbackLast() {
  const history = getHistory();
  if (!history || history.length === 0) {
    return { success: false, message: 'Tidak ada riwayat perubahan yang dapat di-rollback.' };
  }

  const last = history.pop();
  try {
    // Kasus 1: File baru yang dibuat -> Hapus file tersebut
    if (last.isNew) {
      if (fs.existsSync(last.originalPath)) {
        fs.unlinkSync(last.originalPath);
        try {
          delete require.cache[require.resolve(last.originalPath)];
        } catch {}
      }
      saveHistory(history);
      loadCommands();
      return {
        success: true,
        message: `File baru *${last.relativePath}* yang sebelumnya dibuat telah dihapus (undo create)!`,
        entry: last
      };
    }

    // Kasus 2: File yang dimodifikasi atau dihapus -> Pulihkan dari backup
    if (last.backupPath && fs.existsSync(last.backupPath)) {
      const targetDir = path.dirname(last.originalPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.copyFileSync(last.backupPath, last.originalPath);
      try {
        delete require.cache[require.resolve(last.originalPath)];
      } catch {}
      saveHistory(history);

      loadCommands();

      return {
        success: true,
        message: `Berhasil mengembalikan (rollback) file *${last.relativePath}* ke versi sebelumnya!`,
        entry: last
      };
    } else {
      return { success: false, message: `File backup ${last.backupPath} tidak ditemukan di server.` };
    }
  } catch (err) {
    return { success: false, message: `Gagal melakukan rollback: ${err.message}` };
  }
}

/**
 * Validasi sintaks JavaScript menggunakan vm.Script
 */
function validateSyntax(code) {
  try {
    new vm.Script(code);
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err.message,
      line: err.lineNumber || null
    };
  }
}

/**
 * Parsing respon dari AI Neoxr agar menghasilkan data terstruktur
 */
function parseAiResponse(rawText) {
  if (!rawText) return null;

  let text = rawText.trim();

  // 1. Coba parse JSON langsung
  try {
    const obj = JSON.parse(text);
    if (obj.code) return obj;
  } catch {}

  // 2. Coba ekstrak JSON di dalam markdown ```json ... ```
  const jsonBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (jsonBlock) {
    try {
      const obj = JSON.parse(jsonBlock[1].trim());
      if (obj.code) return obj;
    } catch {}
  }

  // 3. Coba cari kurung kurawal pertama { dan terakhir }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const sub = text.substring(firstBrace, lastBrace + 1);
      const obj = JSON.parse(sub);
      if (obj.code) return obj;
    } catch {}
  }

  // 4. Jika AI mengembalikan markdown javascript murni ```javascript ... ```
  const codeBlock =
    text.match(/```(?:javascript|js)\s*([\s\S]*?)```/i) ||
    text.match(/```\s*([\s\S]*?)```/i);

  if (codeBlock) {
    const code = codeBlock[1].trim();
    // Cari nama file dari baris komentar jika ada: // File: commands/... atau // Path: ...
    const fileComment = code.match(/\/\/\s*(?:File|Path|Lokasi):\s*([a-zA-Z0-9_\-\.\/]+)/i);
    let targetFile = fileComment ? fileComment[1].trim() : null;

    // Bersihkan penjelasan di luar code block
    const explanation = text.replace(/```[\s\S]*?```/g, '').trim();

    return {
      targetFile,
      code,
      explanation: explanation || 'Fitur dibuat otomatis oleh AI Neoxr.'
    };
  }

  return null;
}

/**
 * Pembersih kode dari artefak markdown link dan formatting AI yang tidak diinginkan
 */
function sanitizeGeneratedCode(rawCode) {
  if (!rawCode) return '';
  let code = rawCode;

  // 1. Bersihkan formatting markdown link [http...](http...) di dalam URL string
  // Contoh: `[https://api.bmkg.go.id/...?adm4=$](https://api.bmkg.go.id/...?adm4=$){encodedQuery}` -> `https://api.bmkg.go.id/...${encodedQuery}`
  code = code.replace(/\[\s*(https?:\/\/[^\s\]\)]+?)\s*\$?\]\s*\(\s*\1\s*\$?(\{[^\}]+\})?\)/gi, (match, url, expr) => {
    return expr ? `${url}$${expr}` : url;
  });
  code = code.replace(/\[\s*(https?:\/\/[^\s\]\)]+?)\s*\]\s*\(\s*\1\s*\)/gi, '$1');

  // 2. Bersihkan sisa kurung markdown pada URL
  code = code.replace(/`\[(https?:\/\/[^`\]]+)\]`/gi, '`$1`');
  code = code.replace(/'\[(https?:\/\/[^'\]]+)\]'/gi, "'$1'");
  code = code.replace(/"\[(https?:\/\/[^"\]]+)\]"/gi, '"$1"');

  return code;
}

/**
 * Mengirim query ke Neoxr AI dengan prioritas DeepSeek Coder (dan auto-fallback ke model lain jika server Neoxr sibuk)
 */
async function callNeoxrAiWithFallback(systemPrompt) {
  const models = [
    { url: '/deepseek', params: { q: systemPrompt, model: 'deepseek-coder', apikey: config.neoxrApiKey }, name: 'DeepSeek Coder' },
    { url: '/deepseek', params: { q: systemPrompt, model: 'v3', apikey: config.neoxrApiKey }, name: 'DeepSeek V3' },
    { url: '/deepseek', params: { q: systemPrompt, model: 'r1', apikey: config.neoxrApiKey }, name: 'DeepSeek R1' },
    { url: '/gpt4', params: { q: systemPrompt, apikey: config.neoxrApiKey }, name: 'GPT-4' },
    { url: '/gemini-chat', params: { q: systemPrompt, apikey: config.neoxrApiKey }, name: 'Gemini Chat' },
    { url: '/bard', params: { q: systemPrompt, apikey: config.neoxrApiKey }, name: 'Bard' }
  ];

  let lastError = null;

  for (const m of models) {
    try {
      info(`[AUTO-CODER] Mencoba generate kode dengan AI: ${m.name}...`);
      const res = await neoxrClient.get(m.url, {
        params: m.params,
        timeout: 45000
      });

      if (res.data && res.data.status) {
        const rawMessage = res.data.data?.message || res.data.data || '';
        if (rawMessage && typeof rawMessage === 'string' && rawMessage.trim().length > 10) {
          info(`[AUTO-CODER] Berhasil mendapatkan respon dari ${m.name}`);
          return { rawMessage, modelUsed: m.name };
        }
      }
      warn(`[AUTO-CODER] Model ${m.name} mengembalikan status non-sukses: ${res.data?.msg || 'Respon kosong'}. Mencoba model alternatif...`);
    } catch (err) {
      lastError = err;
      warn(`[AUTO-CODER] Model ${m.name} terkendala: ${err.message}. Mencoba model alternatif...`);
    }
  }

  throw new Error(`Seluruh endpoint AI Neoxr (DeepSeek/GPT-4/Gemini/Bard) sedang tidak dapat diakses: ${lastError?.message || 'Timeout'}`);
}

/**
 * Kirim prompt ke AI Neoxr (Utama: DeepSeek) dengan panduan arsitektur bot WhatsApp Baileys
 */
async function generateCodeWithNeoxr({ instruction, targetFile = null, currentCode = null }) {
  const isEditing = Boolean(currentCode);

  let systemPrompt = `Kamu adalah AI Senior Developer & Auto-Coder khusus untuk WhatsApp Bot Baileys bernama 'nayxilaa md'.
Tugasmu adalah membuat atau memodifikasi file command bot WhatsApp sesuai instruksi.

SPESIFIKASI STRUKTUR BOT:
1. Lokasi file command berada di folder 'commands/<kategori>/<nama_file>.js'
   Kategori yang tersedia: general, downloader, maker, ai, group, owner, tools, game, fun, search, dll.
2. Format kode modul command WAJIB persis seperti ini:
\`\`\`javascript
const axios = require('axios'); // atau module lain jika dibutuhkan

module.exports = {
  name: 'nama_command',
  aliases: ['alias1', 'alias2'],
  category: 'kategori',
  description: 'Deskripsi fitur secara jelas',
  usage: '<argumen jika ada>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, text, command, groupMetadata, isOwner, isAdmin, isBotAdmin, user }) => {
    // Logika fitur
    // Balas pesan: await m.reply('teks...');
    // React emoji: await m.react('⏳');
    // Kirim gambar: await sock.sendMessage(m.chat, { image: { url: '...' }, caption: '...' }, { quoted: m });
  }
};
\`\`\`

FITUR & VARIABEL YANG TERSEDIA:
- m.chat: ID chat WhatsApp penerima/tujuan
- m.reply(text, options): Fungsi membalas pesan teks atau quoted
- m.react(emoji): Memberikan reaksi emoji pada pesan (contoh: await m.react('⏳');)
- m.pushName: Nama pengirim pesan
- m.senderNumber: Nomor pengirim (contoh: '628xxx')
- m.quoted: Pesan yang sedang di-reply oleh pengguna (jika ada)
- m.quoted.text: Teks dari pesan yang di-reply
- sock.sendMessage(m.chat, content, options): Fungsi pengiriman pesan lengkap Baileys
- axios: Library HTTP request yang sudah terpasang di bot
- config: require('../../config') (berisi botName, ownerName, prefix, neoxrApiKey, dll)
- neoxr: require('../../lib/neoxr') (helper API Neoxr jika dibutuhkan)

PANDUAN CODING SANGAT PENTING:
- DILARANG menggunakan format link markdown [http...](http...) di dalam string kode JavaScript. Semua URL atau endpoint harus murni plain string seperti 'https://...'.
- Pastikan kode valid JavaScript Node.js (CommonJS: module.exports).
- Selalu tangani error dengan try-catch agar bot tidak crash.
- Berikan pesan respon yang rapi, informatif, dan estetik dengan emoji.
- JANGAN mengimport modul yang tidak ada di Node.js standar kecuali axios, path, fs.`;

  if (isEditing) {
    systemPrompt += `\n\nSTATUS: MODIFIKASI FILE YANG SUDAH ADA
Path file saat ini: ${targetFile}
Berikut adalah isi kode file saat ini:
\`\`\`javascript
${currentCode}
\`\`\`
Instruksi Modifikasi / Perubahan dari Pengguna:
"${instruction}"
Tugas: Buat kembali kode LENGKAP dengan mengaplikasikan modifikasi yang diminta tanpa menghilangkan fungsi penting lainnya.`;
  } else {
    systemPrompt += `\n\nSTATUS: PEMBUATAN FITUR BARU
Instruksi Fitur Baru dari Pengguna:
"${instruction}"
${targetFile ? `User menginginkan file disimpan di path: ${targetFile}` : ''}`;
  }

  systemPrompt += `\n\nWAJIB BALAS HANYA DALAM FORMAT JSON BERIKUT (TANPA TEKS LAIN DI LUAR JSON):
{
  "targetFile": "commands/<kategori>/<nama_file>.js",
  "action": "${isEditing ? 'modify' : 'create'}",
  "commandName": "<nama_utama_command>",
  "category": "<kategori>",
  "explanation": "<penjelasan singkat perubahan atau fitur yang dibuat dalam bahasa Indonesia>",
  "code": "<KODE_JAVASCRIPT_LENGKAP>"
}`;

  try {
    const { rawMessage, modelUsed } = await callNeoxrAiWithFallback(systemPrompt);

    const parsed = parseAiResponse(rawMessage);
    if (!parsed || !parsed.code) {
      throw new Error(`Gagal mengekstrak kode valid dari jawaban AI Neoxr (${modelUsed}).`);
    }

    // Bersihkan kode dari artefak markdown link jika ada
    parsed.code = sanitizeGeneratedCode(parsed.code);
    parsed.modelUsed = modelUsed;

    // Jika targetFile belum ditentukan oleh AI, tentukan otomatis
    if (!parsed.targetFile) {
      if (targetFile) {
        parsed.targetFile = targetFile;
      } else {
        const cat = parsed.category || 'tools';
        const name = parsed.commandName || 'custom_' + Date.now().toString(36);
        parsed.targetFile = `commands/${cat}/${name}.js`;
      }
    }

    return parsed;
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * Terapkan kode ke sistem file, validasi sintaks, backup, dan hot-reload
 */
async function applyCode({ targetFile, code, explanation }) {
  if (!targetFile || !code) {
    throw new Error('targetFile dan code wajib diisi.');
  }

  // 1. Normalisasi dan validasi keamanan path
  let relativePath = targetFile.replace(/^[\\\/]+/, '');
  if (!relativePath.endsWith('.js')) {
    relativePath += '.js';
  }

  const absPath = path.resolve(PROJECT_ROOT, relativePath);
  if (!isPathSafe(absPath)) {
    throw new Error(`Akses ke path '${relativePath}' ditolak karena alasan keamanan.`);
  }

  // 2. Sanitasi kode dari artefak markdown link dan formatting
  code = sanitizeGeneratedCode(code);

  // 3. Validasi sintaks JavaScript sebelum menulis ke disk
  const syntaxCheck = validateSyntax(code);
  if (!syntaxCheck.valid) {
    throw new Error(`Sintaks JavaScript tidak valid:\n${syntaxCheck.error}`);
  }

  // 3. Backup file lama jika sedang memodifikasi, atau siapkan entri history untuk file baru
  const fileExisted = fs.existsSync(absPath);
  let backupInfo = null;
  if (fileExisted) {
    backupInfo = backupFile(absPath, explanation || 'Auto coder update');
  }

  // 4. Pastikan direktori tujuan tersedia
  const dirPath = path.dirname(absPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // 5. Tulis file baru ke disk
  fs.writeFileSync(absPath, code, 'utf-8');

  // Catat riwayat jika ini file baru dibuat (agar bisa di-undocode)
  if (!fileExisted) {
    const history = getHistory();
    history.push({
      id: Date.now(),
      originalPath: absPath,
      relativePath,
      isNew: true,
      backupPath: null,
      timestamp: new Date().toISOString(),
      note: explanation || 'Auto coder create'
    });
    saveHistory(history);
  }

  // 6. Uji muat modul (Require Test)
  try {
    delete require.cache[require.resolve(absPath)];
    const loadedModule = require(absPath);

    if (absPath.startsWith(COMMANDS_DIR)) {
      if (!loadedModule || !loadedModule.name || typeof loadedModule.execute !== 'function') {
        throw new Error('File tidak mengekspor objek command yang valid (harus memiliki properti name dan execute function).');
      }
    }

    // 7. Reload seluruh command ke memori bot
    loadCommands();

    return {
      success: true,
      absPath,
      relativePath,
      isEdit: fileExisted,
      backupInfo,
      explanation,
      commandName: loadedModule?.name || path.basename(absPath, '.js')
    };
  } catch (loadErr) {
    // JIKA UJI MUAT GAGAL: Otomatis Rollback agar bot tidak rusak!
    if (fileExisted && backupInfo) {
      try {
        fs.copyFileSync(backupInfo.backupPath, absPath);
        loadCommands();
      } catch {}
    } else if (!fileExisted && fs.existsSync(absPath)) {
      try {
        fs.unlinkSync(absPath);
        loadCommands();
      } catch {}
    }

    throw new Error(`Gagal memuat modul baru: ${loadErr.message}\nPerubahan otomatis dibatalkan (Safe Rollback).`);
  }
}

/**
 * Hapus file command secara aman dengan backup
 */
function deleteCommandSafely(query) {
  const file = findCommandFile(query);
  if (!file) {
    return { success: false, message: `File atau command '${query}' tidak ditemukan.` };
  }

  if (!isPathSafe(file)) {
    return { success: false, message: `Akses ke file '${file}' ditolak.` };
  }

  const rel = path.relative(PROJECT_ROOT, file);
  const backup = backupFile(file, `Dihapus melalui perintah delete`);

  try {
    fs.unlinkSync(file);
    delete require.cache[require.resolve(file)];
    loadCommands();

    return {
      success: true,
      message: `File *${rel}* berhasil dihapus!\n(Backup tersimpan, bisa di-restore dengan *.undocode*)`,
      backup
    };
  } catch (err) {
    return { success: false, message: `Gagal menghapus file: ${err.message}` };
  }
}

module.exports = {
  PROJECT_ROOT,
  COMMANDS_DIR,
  BACKUP_DIR,
  isPathSafe,
  findCommandFile,
  listAllCommandFiles,
  getHistory,
  backupFile,
  rollbackLast,
  validateSyntax,
  parseAiResponse,
  generateCodeWithNeoxr,
  applyCode,
  deleteCommandSafely
};
