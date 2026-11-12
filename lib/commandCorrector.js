/**
 * Command Corrector & Typo Auto-Suggestion
 * nayxilaa md - WhatsApp Bot
 *
 * Mendeteksi typo pada perintah WhatsApp dan merekomendasikan
 * perintah yang memiliki kemiripan teks menggunakan algoritma
 * Damerau-Levenshtein Distance dan Jaro-Winkler Similarity.
 */

const config = require('../config');
const { getAllCommands } = require('./loader');
const { logMsg } = require('./color');

/**
 * Menghitung Damerau-Levenshtein distance (mendukung transposisi huruf berdekatan)
 */
function damerauLevenshtein(a, b) {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let i = 0; i <= an; i++) matrix[0][i] = i;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Substitusi
          matrix[i][j - 1] + 1,     // Penyisipan (insertion)
          matrix[i - 1][j] + 1      // Penghapusan (deletion)
        );
        // Transposisi (dua huruf bertukar posisi berdampingan, misal: 'cpacut' -> 'capcut')
        if (i > 1 && j > 1 && b[i - 1] === a[j - 2] && b[i - 2] === a[j - 1]) {
          matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
        }
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Menghitung Jaro-Winkler similarity (0.0 s/d 1.0)
 */
function jaroWinkler(s1, s2) {
  if (s1 === s2) return 1.0;
  const l1 = s1.length;
  const l2 = s2.length;
  if (l1 === 0 || l2 === 0) return 0.0;

  const matchDistance = Math.floor(Math.max(l1, l2) / 2) - 1;
  const s1Matches = new Array(l1).fill(false);
  const s2Matches = new Array(l2).fill(false);
  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < l1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, l2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < l1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro = (matches / l1 + matches / l2 + (matches - transpositions / 2) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(l1, l2)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Menghitung skor kemiripan gabungan (Hybrid similarity: 0.0 s/d 1.0)
 */
function calculateSimilarity(s1, s2) {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const dist = damerauLevenshtein(s1, s2);
  const levScore = (maxLen - dist) / maxLen;
  const jwScore = jaroWinkler(s1, s2);

  return (levScore * 0.5) + (jwScore * 0.5);
}

/**
 * Mencari rekomendasi perintah yang mirip dengan input typo
 *
 * @param {string} input - Teks perintah yang diketik pengguna
 * @param {object} options - Opsi filter (isOwner, isGroup)
 * @returns {Array} Daftar rekomendasi perintah
 */
function findSimilarCommands(input, options = {}) {
  const { isOwner = false, isGroup = true } = options;
  const target = (input || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  // Jangan rekomendasikan untuk input kosong atau 1 karakter
  if (target.length < 2) return [];

  const allCmds = getAllCommands();
  const results = [];

  for (const cmd of allCmds) {
    if (!cmd || !cmd.name) continue;

    // Filter akses: jangan rekomendasikan perintah owner ke pengguna biasa
    if (cmd.ownerOnly && !isOwner) continue;

    // Filter akses: jangan rekomendasikan perintah khusus grup di private chat
    if (cmd.groupOnly && !isGroup) continue;

    // Kumpulkan nama utama dan semua alias
    const candidates = [cmd.name, ...(cmd.aliases || [])];
    let bestScore = 0;
    let bestDist = Infinity;
    let matchedName = cmd.name;

    for (const cand of candidates) {
      if (!cand) continue;
      const c = cand.toLowerCase().trim();
      const dist = damerauLevenshtein(target, c);
      const score = calculateSimilarity(target, c);

      if (score > bestScore) {
        bestScore = score;
        bestDist = dist;
        matchedName = cand;
      }
    }

    // Ambang batas toleransi typo dinamis berdasarkan panjang kata:
    // Kata pendek (2-4 huruf): maksimal 1 huruf beda, skor >= 0.65
    // Kata sedang (5-6 huruf): maksimal 2 huruf beda, skor >= 0.60
    // Kata panjang (>6 huruf): maksimal 3 huruf beda, skor >= 0.55
    const maxAllowedDist = target.length <= 4 ? 1 : (target.length <= 6 ? 2 : 3);
    const minScore = target.length <= 4 ? 0.65 : (target.length <= 6 ? 0.60 : 0.55);

    if (bestScore >= minScore && bestDist <= maxAllowedDist) {
      results.push({
        name: cmd.name,
        matched: matchedName,
        category: cmd.category || 'general',
        description: cmd.description || '',
        score: bestScore,
        dist: bestDist
      });
    }
  }

  if (results.length === 0) return [];

  // Urutkan berdasarkan skor tertinggi dan jarak terkecil
  results.sort((a, b) => b.score - a.score || a.dist - b.dist);

  // Ambil hanya yang memiliki skor mendekati rekomendasi terbaik (selisih <= 0.12)
  const topScore = results[0].score;
  return results.filter(r => r.score >= topScore - 0.12).slice(0, 3);
}

/**
 * Memproses typo perintah dan mengirim pesan rekomendasi ke WhatsApp
 *
 * @param {object} sock - Socket Baileys
 * @param {object} m - Objek pesan terserialisasi
 * @param {string} command - Perintah typo yang diketik pengguna
 * @param {string} usedPrefix - Simbol prefix yang digunakan (misal '.')
 * @param {object} options - Opsi tambahan
 * @returns {Promise<boolean>} True jika rekomendasi berhasil dikirim, false jika tidak ada
 */
async function handleCommandTypo(sock, m, command, usedPrefix = '.', options = {}) {
  // Cek apakah fitur koreksi diaktifkan di konfigurasi
  if (config.commandCorrection === false) {
    return false;
  }

  const suggestions = findSimilarCommands(command, options);
  if (!suggestions || suggestions.length === 0) {
    return false;
  }

  const p = usedPrefix || config.prefix || '.';

  let replyText = '';
  if (suggestions.length === 1) {
    const item = suggestions[0];
    const desc = item.description ? `\n_${item.description}_` : '';
    replyText =
      `🔍 Perintah *${p}${command}* tidak ditemukan.\n\n` +
      `Mungkin yang Anda maksud adalah:\n` +
      `👉 *${p}${item.name}*${desc}\n\n` +
      `_Ketik *${p}menu* untuk melihat seluruh daftar perintah._`;
  } else {
    const list = suggestions
      .map((s) => `👉 *${p}${s.name}*${s.description ? ` - _${s.description}_` : ''}`)
      .join('\n');
    replyText =
      `🔍 Perintah *${p}${command}* tidak ditemukan.\n\n` +
      `Mungkin yang Anda maksud:\n${list}\n\n` +
      `_Ketik *${p}menu* untuk melihat seluruh daftar perintah._`;
  }

  try {
    logMsg(
      m.isGroup ? 'GROUP' : 'PRIVATE',
      `@${m.senderNumber} (${m.pushName})`,
      `[TYPO] ${p}${command} -> ${suggestions.map(s => s.name).join(', ')}`
    );
    await m.reply(replyText.trim());
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  damerauLevenshtein,
  jaroWinkler,
  calculateSimilarity,
  findSimilarCommands,
  handleCommandTypo
};
