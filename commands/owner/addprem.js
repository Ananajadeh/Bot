/**
 * Command: addprem
 * Menambahkan status Member Premium ke pengguna WhatsApp
 */

const config = require('../../config');
const { db, formatDuration, formatDateWIB } = require('../../lib/database');
const { normalizeNumber } = require('../../lib/serialize');

module.exports = {
  name: 'addprem',
  aliases: ['addpremium', 'prem'],
  category: 'owner',
  description: 'Menambahkan status member premium ke user',
  usage: '<hari> <nomor_wa / @user / reply>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m, args }) => {
    if (!args[0]) {
      return m.reply(
        `💡 *Format Perintah Add Premium:*\n\n` +
        `• Via Nomor:\n  \`${config.prefix}addprem <hari> <nomor_wa>\`\n` +
        `  *Contoh:* \`${config.prefix}addprem 30 6283841800798\`\n\n` +
        `• Via Balas Chat / Tag:\n  \`${config.prefix}addprem 30 @user\` atau reply chat target.`
      );
    }

    const days = parseInt(args[0], 10);
    if (isNaN(days) || days <= 0) {
      return m.reply(`⚠️ Masukkan jumlah hari yang valid! Contoh: \`${config.prefix}addprem 30 628xxx\``);
    }

    let targetNum = '';
    let targetName = 'User';

    if (m.quoted) {
      targetNum = m.quoted.senderNumber;
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
      targetNum = normalizeNumber(m.mentionedJid[0]);
    } else if (args[1]) {
      targetNum = normalizeNumber(args[1]);
    }

    if (!targetNum || targetNum.length < 7) {
      return m.reply(
        `⚠️ Nomor WhatsApp tidak valid atau tidak ditemukan!\n` +
        `Contoh: \`${config.prefix}addprem ${days} 6283841800798\``
      );
    }

    // Daftarkan premium ke database
    const user = db.addPremium(targetNum, days, targetName);

    await m.react('👑');
    return m.reply(
      `👑 *BERHASIL MENAMBAHKAN PREMIUM!*\n\n` +
      `• 👤 Nomor Target : \`+${targetNum}\`\n` +
      `• ⏱️ Durasi       : *+${days} Hari*\n` +
      `• ⏳ Total Waktu  : *${formatDuration(user.premiumExpires - Date.now())}*\n` +
      `• 📅 Kedaluwarsa  : *${formatDateWIB(user.premiumExpires)}*\n` +
      `• 🎟️ Limit Harian : *${user.limit} / 50 Limit*\n` +
      `• 💬 Akses PC     : *Aktif (Private Chat Bebas)*\n\n` +
      `_Status premium telah berhasil diaktifkan._`
    );
  }
};
