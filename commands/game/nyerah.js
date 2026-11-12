/**
 * Command: nyerah / surrender
 * Menyerah dari sesi permainan tebak-tebakan yang sedang aktif
 */

const { getGame, endGame } = require('../../lib/game');

module.exports = {
  name: 'nyerah',
  aliases: ['surrender'],
  category: 'game',
  description: 'Menyerah dari game yang sedang aktif dan melihat jawaban',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m }) => {
    const game = getGame(m.chat);
    if (!game) {
      return m.reply('⚠️ Tidak ada permainan yang sedang berlangsung di chat ini!');
    }

    endGame(m.chat);

    return sock.sendMessage(
      m.chat,
      {
        text:
          `🏳️ *KAMU MENYERAH!*\n\n` +
          `◦ *Game    :* ${game.title}\n` +
          `◦ *Jawaban :* *${game.answer}*\n\n` +
          `_Ketik perintah game lagi untuk bermain kembali!_`
      },
      { quoted: m }
    );
  }
};
