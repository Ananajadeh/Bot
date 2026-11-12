/**
 * Group Protection System
 * Menangani: Anti-Toxic, Anti-Virtex, Anti-Tagall, Anti-Sticker Spam
 */

const { db } = require('./database');
const { warn } = require('./color');

// Cache throttling untuk peringatan spam agar bot tidak membanjiri chat
const warnThrottle = new Map();

// Tracker stiker untuk anti-sticker spam: Map<`${jid}:${sender}`, number[]>
const stickerTimestamps = new Map();

// Daftar kata kasar / toxic umum dalam bahasa Indonesia & Inggris
const TOXIC_PATTERNS = [
  /a+n+j+i+n+g+/i,
  /a+n+j+i+n+k+/i,
  /a+n+j+g+/i,
  /a+j+g+/i,
  /b+a+b+i+/i,
  /b+a+n+g+s+a+t+/i,
  /b+g+s+t+/i,
  /b+a+j+i+n+g+a+n+/i,
  /k+o+n+t+o+l+/i,
  /k+n+t+o+l+/i,
  /k+n+t+l+/i,
  /m+e+m+e+k+/i,
  /m+m+k+/i,
  /j+e+m+b+u+t+/i,
  /j+m+b+t+/i,
  /n+g+e+n+t+o+t+/i,
  /n+g+e+n+t+d+/i,
  /n+g+e+n+t+t+/i,
  /p+a+n+t+e+k+/i,
  /p+a+n+t+e+q+/i,
  /p+e+l+e+r+/i,
  /p+e+p+e+k+/i,
  /i+t+i+l+/i,
  /l+o+n+t+e+/i,
  /p+e+r+e+k+/i,
  /t+o+l+o+l+/i,
  /g+o+b+l+o+k+/i,
  /g+b+l+k+/i,
  /i+d+i+o+t+/i,
  /b+e+g+o+/i,
  /k+a+m+p+r+e+t+/i,
  /a+s+u+/i,
  /p+u+k+i+/i,
  /p+u+k+i+m+a+k+/i,
  /t+o+k+e+t+/i,
  /f+u+c+k+/i,
  /b+i+t+c+h+/i,
  /a+s+s+h+o+l+e+/i
];

function isToxic(text) {
  if (!text || typeof text !== 'string') return false;
  // Pisahkan teks menjadi kata-kata untuk mencegah false positive pada kata biasa
  const words = text.toLowerCase().split(/[\s,.;:!?_/\-+*=~`"'\(\)\[\]{}<>]+/);
  for (const word of words) {
    if (!word || word.length < 2) continue;
    for (const pattern of TOXIC_PATTERNS) {
      if (pattern.test(word)) {
        return true;
      }
    }
  }
  return false;
}

// Deteksi karakter virtex / bug text crash
function isVirtex(text) {
  if (!text || typeof text !== 'string') return false;

  // 1. Pesan sangat panjang (> 3500 karakter dalam grup)
  if (text.length > 3500) {
    return true;
  }

  // 2. Karakter zero-width / bidi / invisible chars (> 30 karakter)
  const invisibleChars = text.match(/[\u200B-\u200F\uFEFF\u200E\u202A-\u202E\u2060-\u206F]/g);
  if (invisibleChars && invisibleChars.length > 30) {
    return true;
  }

  // 3. Excessive combining marks (Zalgo crash text)
  const zalgo = text.match(/[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]{20,}/g);
  if (zalgo && zalgo.length > 0) {
    return true;
  }

  return false;
}

function shouldThrottleWarn(key, cooldownMs = 8000) {
  const now = Date.now();
  const lastTime = warnThrottle.get(key) || 0;
  if (now - lastTime < cooldownMs) {
    return true;
  }
  warnThrottle.set(key, now);
  return false;
}

/**
 * Memeriksa seluruh proteksi grup terhadap pesan masuk.
 * Mengembalikan true jika pesan diblokir / diambil tindakan dan tidak boleh diproses lebih lanjut.
 */
async function checkGroupProtection(sock, m, { groupMetadata, isAdmin, isBotAdmin }) {
  if (!m || !m.isGroup) return false;

  // Admin grup dan Owner bot memiliki kekebalan terhadap semua aturan anti-*
  if (m.isOwner || isAdmin) {
    return false;
  }

  const group = db.getGroup(m.chat, groupMetadata?.subject);
  const text = m.body || '';

  // 1. CEK ANTI-VIRTEX
  if (group.antivirtex && isVirtex(text)) {
    try {
      if (isBotAdmin) {
        await sock.sendMessage(m.chat, { delete: m.key });
        await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
        await sock.sendMessage(m.chat, {
          text: `🚨 *ANTI-VIRTEX DETECTED!*\n\nMember @${m.senderNumber} telah dikeluarkan dari grup karena mengirim pesan berpotensi Virtex / Bug Text.`,
          mentions: [m.sender]
        });
      } else {
        await sock.sendMessage(m.chat, {
          text: `🚨 *PERINGATAN ANTI-VIRTEX!*\n\n@${m.senderNumber} terdeteksi mengirim Virtex / Bug Text!\nJadikan bot sebagai Admin agar pelaku dapat ditindak otomatis.`,
          mentions: [m.sender]
        });
      }
      return true;
    } catch (err) {
      warn(`Gagal memproses Anti-Virtex: ${err.message}`);
      return true;
    }
  }

  // 2. CEK ANTI-TAGALL (Mass mention ilegal oleh non-admin)
  if (group.antitagall && m.mentionedJid && m.mentionedJid.length >= 6) {
    try {
      if (isBotAdmin) {
        await sock.sendMessage(m.chat, { delete: m.key });
      }
      if (!shouldThrottleWarn(`${m.chat}:${m.senderNumber}:antitagall`)) {
        await sock.sendMessage(m.chat, {
          text: `⚠️ *ANTI-TAGALL AKTIF!*\n\n@${m.senderNumber}, Anda dilarang melakukan tag-all atau mass mention di dalam grup ini!`,
          mentions: [m.sender]
        });
      }
      return true;
    } catch (err) {
      warn(`Gagal memproses Anti-Tagall: ${err.message}`);
      return true;
    }
  }

  // 3. CEK ANTI-STICKER SPAM
  if (group.antistickerspam && (m.type === 'stickerMessage' || m.msg?.mimetype?.includes('webp'))) {
    const key = `${m.chat}:${m.senderNumber}`;
    const now = Date.now();
    let timestamps = stickerTimestamps.get(key) || [];
    // Simpan riwayat stiker dalam 6 detik terakhir
    timestamps = timestamps.filter((t) => now - t < 6000);
    timestamps.push(now);
    stickerTimestamps.set(key, timestamps);

    if (timestamps.length >= 4) {
      // Lebih dari 3 stiker dalam 6 detik tergolong spam
      try {
        if (isBotAdmin) {
          await sock.sendMessage(m.chat, { delete: m.key });
        }
        if (!shouldThrottleWarn(`${key}:antistickerspam`)) {
          await sock.sendMessage(m.chat, {
            text: `⚠️ *ANTI-STICKER SPAM AKTIF!*\n\n@${m.senderNumber}, mohon tidak melakukan spam stiker secara beruntun di grup ini!`,
            mentions: [m.sender]
          });
        }
        return true;
      } catch (err) {
        warn(`Gagal memproses Anti-Sticker Spam: ${err.message}`);
        return true;
      }
    }
  }

  // 4. CEK ANTI-TOXIC / ANTI-KATA KASAR
  if (group.antitoxic && text && isToxic(text)) {
    try {
      if (isBotAdmin) {
        await sock.sendMessage(m.chat, { delete: m.key });
      }
      if (!shouldThrottleWarn(`${m.chat}:${m.senderNumber}:antitoxic`)) {
        await sock.sendMessage(m.chat, {
          text: `⚠️ *ANTI-TOXIC AKTIF!*\n\n@${m.senderNumber}, pesan Anda dihapus karena mengandung kata kasar / tidak pantas! Mohon hormati sesama member grup.`,
          mentions: [m.sender]
        });
      }
      return true;
    } catch (err) {
      warn(`Gagal memproses Anti-Toxic: ${err.message}`);
      return true;
    }
  }

  return false;
}

module.exports = {
  checkGroupProtection,
  isToxic,
  isVirtex
};
