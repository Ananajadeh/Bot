/**
 * Command: setlimit
 * Mengatur jumlah limit user secara manual oleh Owner
 */

const config = require('../../config');
const { db } = require('../../lib/database');
const { normalizeNumber } = require('../../lib/serialize');

module.exports = {
  name: 'setlimit',
  aliases: ['addlimit'],
  category: 'owner',
  description: 'Mengatur limit pengguna secara manual',
  usage: '<nomor_wa / @user> <jumlah>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m, args }) => {
    let targetNum = '';
    let amount = 0;

    if (m.quoted) {
      targetNum = m.quoted.senderNumber;
      amount = parseInt(args[0], 10);
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
      targetNum = normalizeNumber(m.mentionedJid[0]);
      amount = parseInt(args[1], 10);
    } else if (args[0] && args[1]) {
      targetNum = normalizeNumber(args[0]);
      amount = parseInt(args[1], 10);
    }

    if (!targetNum || isNaN(amount)) {
      return m.reply(
        `💡 *Cara Menggunakan:*\n` +
        `\`${config.prefix}setlimit <nomor> <jumlah>\`\n` +
        `*Contoh:* \`${config.prefix}setlimit 6283841800798 100\``
      );
    }

    const user = db.getUser(targetNum);
    user.limit = amount;
    db.save();

    return m.reply(`✅ Berhasil mengatur limit untuk \`+${targetNum}\` menjadi *${amount} Limit*.`);
  }
};
