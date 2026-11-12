/**
 * Error Reporting & Handling System
 * Menampilkan pesan eror langsung di platform (Chat WhatsApp & Notifikasi ke Owner)
 */

const config = require('../config');
const { error } = require('./color');

/**
 * Format stack trace agar bersih dan mudah dibaca di layar WhatsApp
 * @param {string} stack
 */
function cleanStackTrace(stack) {
  if (!stack) return 'Tidak ada stack trace';
  const lines = stack.split('\n');
  // Ambil maksimal 8 baris teratas
  const filtered = lines.slice(0, 8);
  return filtered.join('\n');
}

/**
 * Tampilkan pesan eror langsung di platform (chat pengguna dan diteruskan ke Owner)
 * @param {object} sock - Baileys socket
 * @param {object} m - Serialized message
 * @param {string} command - Nama perintah yang sedang diproses
 * @param {Error} err - Objek eror
 */
async function handlePlatformError(sock, m, command, err) {
  const errMsg = err?.message || String(err);
  const errStack = cleanStackTrace(err?.stack || errMsg);
  const errName = err?.name || 'Error';
  const cmdName = command ? `${config.prefix || '.'}${command}` : '-';

  error(`[PLATFORM ERROR] Command: ${cmdName} | Error: ${errMsg}\n${err?.stack || ''}`);

  // 1. Tampilkan eror di chat tempat perintah dijalankan (Platform WhatsApp)
  const chatReport =
    `❌ *TERJADI KESALAHAN PADA SISTEM (ERROR)* ❌\n\n` +
    `◦ *Perintah :* \`${cmdName}\`\n` +
    `◦ *Pengirim :* @${m?.senderNumber || 'Pengguna'}\n` +
    `◦ *Tipe     :* ${errName}\n` +
    `◦ *Pesan    :* ${errMsg}\n\n` +
    `*Stack Trace:*\n` +
    `\`\`\`\n${errStack}\n\`\`\`\n\n` +
    `_Laporan eror ini otomatis diteruskan ke platform._`;

  try {
    if (m && m.chat) {
      // Reaksi silang merah pada pesan
      try {
        await m.react?.('❌');
      } catch {}

      if (typeof m.reply === 'function') {
        await m.reply(chatReport, {
          mentions: m.sender ? [m.sender] : []
        });
      } else if (sock && typeof sock.sendMessage === 'function') {
        await sock.sendMessage(m.chat, {
          text: chatReport,
          mentions: m.sender ? [m.sender] : []
        });
      }
    }
  } catch (sendErr) {
    error(`Gagal mengirim laporan eror ke chat: ${sendErr.message}`);
  }

  // 2. Teruskan laporan eror ke nomor Owner di platform WhatsApp
  try {
    const rawOwner = Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : config.ownerNumber;
    let ownerNum = String(rawOwner || '').replace(/[^0-9]/g, '');
    if (ownerNum.startsWith('0')) ownerNum = '62' + ownerNum.slice(1);

    if (ownerNum && ownerNum.length >= 8 && sock && typeof sock.sendMessage === 'function') {
      const ownerJid = `${ownerNum}@s.whatsapp.net`;
      // Hindari duplikasi jika eror sudah terjadi di chat pribadi owner
      if (m?.chat !== ownerJid) {
        const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const ownerReport =
          `🚨 *LAPORAN EROR PLATFORM BOT* 🚨\n\n` +
          `◦ *Waktu    :* ${time} WIB\n` +
          `◦ *Perintah :* \`${cmdName}\`\n` +
          `◦ *Pengirim :* @${m?.senderNumber || '-'} (${m?.pushName || 'User'})\n` +
          `◦ *Lokasi   :* ${m?.isGroup ? `Grup (${m.chat})` : 'Private Chat'}\n` +
          `◦ *Tipe     :* ${errName}\n` +
          `◦ *Pesan    :* ${errMsg}\n\n` +
          `*Stack Trace:*\n` +
          `\`\`\`\n${errStack}\n\`\`\``;

        await sock.sendMessage(ownerJid, {
          text: ownerReport,
          mentions: m?.sender ? [m.sender] : []
        });
      }
    }
  } catch (ownerErr) {
    // Lewatkan jika gagal ke owner
  }
}

module.exports = {
  handlePlatformError,
  cleanStackTrace
};
