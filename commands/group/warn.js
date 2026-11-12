/**
 * Command: warn / unwarn / listwarn
 * Sistem peringatan pelanggaran member grup (3x warn = otomatis kick)
 */

const config = require('../../config');
const { db } = require('../../lib/database');
const { normalizeNumber } = require('../../lib/serialize');

module.exports = {
  name: 'warn',
  aliases: ['warning', 'unwarn', 'listwarn'],
  category: 'group',
  description: 'Memberikan peringatan ke member grup (3x = kick otomatis)',
  usage: '<@user / reply> [alasan]',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: true,
  ownerOnly: false,

  execute: async ({ sock, m, args, command, groupMetadata }) => {
    const group = db.getGroup(m.chat, groupMetadata?.subject);
    if (!group.warns) group.warns = {};

    // Jika perintah adalah listwarn
    if (command === 'listwarn') {
      const warnedList = Object.entries(group.warns).filter(([_, count]) => count > 0);
      if (warnedList.length === 0) {
        return m.reply('📋 *DAFTAR PERINGATAN GRUP*\n\nSaat ini tidak ada member yang memiliki peringatan aktif di grup ini.');
      }

      let text = `╭━━━「 *DAFTAR WARN GRUP* 」━━━\n`;
      text += `┃ *Grup:* ${groupMetadata?.subject || 'Grup'}\n`;
      text += `╰━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      warnedList.forEach(([num, count], i) => {
        text += `${i + 1}. @${num} : *${count} / 3 Peringatan*\n`;
      });

      return m.reply(text, {
        mentions: warnedList.map(([num]) => num + '@s.whatsapp.net')
      });
    }

    // Tentukan target nomor
    let targetNum = '';
    let reason = '';

    if (m.quoted) {
      targetNum = m.quoted.senderNumber;
      reason = args.join(' ').trim() || 'Melanggar aturan grup';
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
      targetNum = normalizeNumber(m.mentionedJid[0]);
      reason = args.slice(1).join(' ').trim() || 'Melanggar aturan grup';
    }

    if (!targetNum) {
      return m.reply(
        `💡 *Cara Menggunakan Fitur Warn:*\n\n` +
        `• Tambah Peringatan:\n  \`${config.prefix}warn @user [alasan]\` atau reply chat target.\n` +
        `• Kurangi Peringatan:\n  \`${config.prefix}unwarn @user\` atau reply chat target.\n` +
        `• Cek Daftar Peringatan:\n  \`${config.prefix}listwarn\``
      );
    }

    // Jika perintah unwarn
    if (command === 'unwarn') {
      const current = group.warns[targetNum] || 0;
      if (current <= 0) {
        return m.reply(`ℹ️ Member @${targetNum} tidak memiliki poin peringatan aktif.`, {
          mentions: [targetNum + '@s.whatsapp.net']
        });
      }

      group.warns[targetNum] = Math.max(0, current - 1);
      db.save();

      return m.reply(
        `✅ *PERINGATAN DIKURANGI!*\n\n` +
        `• Member: @${targetNum}\n` +
        `• Poin Peringatan: *${group.warns[targetNum]} / 3*`,
        { mentions: [targetNum + '@s.whatsapp.net'] }
      );
    }

    // Perintah warn (tambah peringatan)
    const current = (group.warns[targetNum] || 0) + 1;
    group.warns[targetNum] = current;
    db.save();

    if (current >= 3) {
      // Reset warn dan kick member
      delete group.warns[targetNum];
      db.save();

      await m.reply(
        `🚨 *BATAS PERINGATAN TERCAPAI (3/3)!*\n\n` +
        `Member @${targetNum} telah mencapai batas maksimal 3 peringatan.\n` +
        `*Alasan Terakhir:* ${reason}\n\n` +
        `_Bot otomatis mengeluarkan member dari grup._`,
        { mentions: [targetNum + '@s.whatsapp.net'] }
      );

      try {
        await sock.groupParticipantsUpdate(m.chat, [targetNum + '@s.whatsapp.net'], 'remove');
      } catch (kickErr) {
        await m.reply(`❌ Gagal mengeluarkan member: ${kickErr.message}`);
      }
    } else {
      await m.reply(
        `⚠️ *PERINGATAN DIBERIKAN (${current}/3)!*\n\n` +
        `• Member : @${targetNum}\n` +
        `• Alasan : ${reason}\n` +
        `• Sisa   : *${3 - current} Peringatan* lagi sebelum dikeluarkan otomatis!`,
        { mentions: [targetNum + '@s.whatsapp.net'] }
      );
    }
  }
};
