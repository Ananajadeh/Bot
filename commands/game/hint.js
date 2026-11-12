/**
 * Command: hint / clue
 * Mendapatkan petunjuk huruf untuk game yang sedang aktif
 */

const { getGame, makeClue } = require('../../lib/game');

module.exports = {
  name: 'hint',
  aliases: ['clue'],
  category: 'game',
  description: 'Dapatkan petunjuk huruf untuk permainan tebakan yang aktif',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m }) => {
    const game = getGame(m.chat);
    if (!game) {
      return m.reply('⚠️ Tidak ada permainan yang sedang berlangsung di chat ini!');
    }

    const clue = makeClue(game.answer);
    return m.reply(`💡 *PETUNJUK KATA:*\n\`${clue}\``);
  }
};
