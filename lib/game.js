/**
 * Game Session Manager
 * Mengelola sesi permainan tebak-tebakan:
 * - Asah Otak
 * - Siapa Aku
 * - Susun Kata
 * - Tebak Gambar
 */

const { db } = require('./database');

// Map sesi game aktif per chat (chatJid => session)
const activeGames = new Map();

/**
 * Buat petunjuk / clue huruf dengan menyembunyikan sebagian huruf
 * @param {string} answer
 */
function makeClue(answer) {
  if (!answer) return '';
  if (Array.isArray(answer)) answer = answer[0];
  return String(answer)
    .split(' ')
    .map((word) => {
      if (word.length <= 2) return word;
      const chars = word.split('');
      return chars
        .map((ch, idx) => {
          if (idx === 0 || idx === chars.length - 1) return ch;
          if (/[a-zA-Z0-9]/.test(ch)) return '_';
          return ch;
        })
        .join(' ');
    })
    .join('   ');
}

/**
 * Hitung jarak edit Levenshtein untuk deteksi jawaban mendekati
 */
function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Memulai sesi game baru di suatu chat
 * @param {object} sock - Baileys socket
 * @param {string} chat - Chat JID
 * @param {object} gameData - Data game (title, question, answer, desc, msgId, timeLimit)
 */
async function startGame(sock, chat, gameData) {
  // Jika sudah ada game aktif di chat ini
  if (activeGames.has(chat)) {
    const existing = activeGames.get(chat);
    return {
      success: false,
      message:
        `⚠️ Masih ada permainan *${existing.title}* yang sedang berlangsung di chat ini!\n\n` +
        `Selesaikan terlebih dahulu atau ketik *.nyerah* jika menyerah.`
    };
  }

  const timeLimit = gameData.timeLimit || 90; // Default 90 detik

  // Timer waktu habis
  const timer = setTimeout(async () => {
    if (activeGames.has(chat)) {
      const g = activeGames.get(chat);
      activeGames.delete(chat);
      const displayAnswer = Array.isArray(g.answer) ? g.answer.join(', ') : g.answer;
      try {
        await sock.sendMessage(chat, {
          text:
            `⌛ *WAKTU HABIS!*\n\n` +
            `◦ *Game     :* ${g.title}\n` +
            `◦ *Jawaban  :* *${displayAnswer}*\n\n` +
            `_Jangan kecewa! Ketik perintah game lagi untuk mencoba tantangan baru._`
        });
      } catch {}
    }
  }, timeLimit * 1000);

  activeGames.set(chat, {
    ...gameData,
    timeout: timer,
    startTime: Date.now(),
    rewardLimit: gameData.rewardLimit || 1
  });

  return { success: true };
}

/**
 * Dapatkan sesi game yang sedang aktif di chat
 * @param {string} chat
 */
function getGame(chat) {
  return activeGames.get(chat) || null;
}

/**
 * Hentikan / batalkan sesi game di chat
 * @param {string} chat
 */
function endGame(chat) {
  if (activeGames.has(chat)) {
    const g = activeGames.get(chat);
    clearTimeout(g.timeout);
    activeGames.delete(chat);
    return g;
  }
  return null;
}

/**
 * Cek apakah pesan pengguna merupakan jawaban game, hint, atau nyerah
 * @param {object} sock - Baileys socket
 * @param {object} m - Serialized message
 * @param {string} text - Isi teks pesan
 * @returns {Promise<boolean>} True jika pesan diproses oleh sistem game
 */
async function checkGameAnswer(sock, m, text) {
  if (!text || !activeGames.has(m.chat)) return false;

  const game = activeGames.get(m.chat);
  const input = text.trim();
  const inputLower = input.toLowerCase();
  const displayAnswer = Array.isArray(game.answer) ? game.answer.join(', ') : game.answer;

  // 1. Perintah Menyerah
  if (['nyerah', '.nyerah', '#nyerah', '!nyerah', '.surrender', 'surrender'].includes(inputLower)) {
    clearTimeout(game.timeout);
    activeGames.delete(m.chat);
    await sock.sendMessage(
      m.chat,
      {
        text:
          `🏳️ *KAMU MENYERAH!*\n\n` +
          `◦ *Game    :* ${game.title}\n` +
          `◦ *Jawaban :* *${displayAnswer}*\n\n` +
          `_Ketik perintah game lagi untuk bermain kembali!_`
      },
      { quoted: m }
    );
    return true;
  }

  // 2. Perintah Petunjuk (Hint / Bantuan)
  if (['hint', '.hint', '#hint', '!hint', 'bantuan', '.bantuan', '#bantuan'].includes(inputLower)) {
    const clue = makeClue(game.answer);
    await m.reply(`💡 *PETUNJUK KATA:*\n\`${clue}\``);
    return true;
  }

  // 3. Pengecekan Jawaban Benar
  const cleanInput = inputLower.replace(/[^a-z0-9]/g, '');
  let isCorrect = false;
  let matchedAnswer = '';

  if (Array.isArray(game.answer)) {
    for (const ans of game.answer) {
      const cAns = ans.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanInput && cAns && cleanInput === cAns) {
        isCorrect = true;
        matchedAnswer = ans;
        break;
      }
    }
  } else {
    const cleanAnswer = String(game.answer).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanInput && cleanAnswer && cleanInput === cleanAnswer) {
      isCorrect = true;
      matchedAnswer = game.answer;
    }
  }

  if (isCorrect) {
    clearTimeout(game.timeout);
    activeGames.delete(m.chat);

    // Tambah limit sebagai hadiah kemenangan
    const user = db.getUser(m.senderNumber, m.pushName);
    const reward = game.rewardLimit || 1;
    user.limit = (user.limit || 0) + reward;
    db.save();

    const duration = Math.max(1, Math.round((Date.now() - game.startTime) / 1000));
    const extraInfo = Array.isArray(game.answer) && game.answer.length > 1
      ? `\n◦ *Daftar Jawaban :* ${displayAnswer}`
      : '';

    await sock.sendMessage(
      m.chat,
      {
        text:
          `🎉 *SELAMAT JAWABAN ANDA BENAR!* 🎉\n\n` +
          `◦ *Game     :* ${game.title}\n` +
          `◦ *Pemenang :* @${m.senderNumber}\n` +
          `◦ *Jawaban  :* *${matchedAnswer}*${extraInfo}\n` +
          `◦ *Durasi   :* ${duration} detik\n` +
          `◦ *Hadiah   :* +${reward} Limit\n\n` +
          `_Sisa limit Anda: ${user.limit} Limit_\n` +
          `_Ketik perintah game untuk bermain kembali!_`,
        mentions: [m.sender]
      },
      { quoted: m }
    );

    await m.react('🎉');
    return true;
  }

  // 4. Deteksi "Hampir Benar" (Dikit lagi)
  if (!Array.isArray(game.answer)) {
    const cleanAnswer = String(game.answer).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanInput.length >= 4 && cleanAnswer.length >= 4) {
      const dist = editDistance(cleanInput, cleanAnswer);
      if (dist <= 2 && dist > 0) {
        await m.reply(`⚠️ *Dikit lagi!* Jawabanmu hampir benar, coba periksa ejaannya.`);
        return true;
      }
    }
  }

  // Jika pesan meng-quote langsung pertanyaan bot dan salah
  if (m.quoted && m.quoted.id === game.msgId) {
    await m.react('❌');
    return true;
  }

  return false;
}

module.exports = {
  startGame,
  getGame,
  endGame,
  checkGameAnswer,
  makeClue
};
