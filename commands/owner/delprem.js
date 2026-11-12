/**
 * Command: delprem
 * Menghapus status Member Premium dari pengguna
 */

const config = require('../../config');
const { db } = require('../../lib/database');
const { normalizeNumber } = require('../../lib/serialize');

module.exports = {
  name: 'delprem',
  aliases: ['delpremium', 'unprem', 'hapusprem'],
  category: 'owner',
  description: 'Mencabut status member premium dari user',
  usage: '<nomor_wa / @user / reply>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m, args }) => {
    let targetNum = '';

    if (m.quoted) {
      targetNum = m.quoted.senderNumber;
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
      targetNum = normalizeNumber(m.mentionedJid[0]);
    } else if (args[0]) {
      targetNum = normalizeNumber(args[0]);
    }

    if (!targetNum || targetNum.length < 7) {
      return m.reply(
        `⚠️ Nomor WhatsApp tidak valid!\n` +
        `Contoh: \`${config.prefix}delprem 6283841800798\` atau balas chat target.`
      );
    }

    const success = db.delPremium(targetNum);
    if (success) {
      return m.reply(`✅ Status premium pengguna \`+${targetNum}\` berhasil dicabut. Limit harian dikembalikan ke reguler (5 limit).`);
    } else {
      return m.reply(`⚠️ Pengguna \`+${targetNum}\` tidak ditemukan dalam daftar premium.`);
    }
  }
};
