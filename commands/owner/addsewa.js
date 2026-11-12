/**
 * Command: addsewa
 * Menyewakan bot ke grup WhatsApp melalui link grup atau di dalam grup aktif
 */

const config = require('../../config');
const { db, formatDuration, formatDateWIB } = require('../../lib/database');

module.exports = {
  name: 'addsewa',
  aliases: ['sewa', 'sewabot'],
  category: 'owner',
  description: 'Menyewakan bot ke grup via link grup atau grup aktif',
  usage: '<hari> <link_grup> atau <hari>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ sock, m, args, groupMetadata }) => {
    if (!args[0]) {
      return m.reply(
        `💡 *Format Perintah Sewa Bot:*\n\n` +
        `• Via Link Grup:\n  \`${config.prefix}addsewa <hari> <link_grup>\`\n` +
        `  *Contoh:* \`${config.prefix}addsewa 30 https://chat.whatsapp.com/ABCxyz123\`\n\n` +
        `• Di Dalam Grup Langsung:\n  \`${config.prefix}addsewa <hari>\`\n` +
        `  *Contoh:* \`${config.prefix}addsewa 30\``
      );
    }

    const days = parseInt(args[0], 10);
    if (isNaN(days) || days <= 0) {
      return m.reply(`⚠️ Masukkan jumlah hari yang valid! Contoh: \`${config.prefix}addsewa 30 <link>\``);
    }

    let targetJid = '';
    let groupSubject = '';

    // Cek apakah ada link grup di argumen kedua atau teks pesan
    const linkArg = args.find((a) => a.includes('chat.whatsapp.com'));

    if (linkArg) {
      const match = linkArg.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,26})/i);
      if (!match) {
        return m.reply('⚠️ Link undangan grup WhatsApp tidak valid!');
      }

      const inviteCode = match[1];
      try {
        await m.react('⏳');

        // Dapatkan info grup terlebih dahulu
        let inviteInfo = null;
        try {
          inviteInfo = await sock.groupGetInviteInfo(inviteCode);
          groupSubject = inviteInfo?.subject || 'Grup WhatsApp';
          targetJid = inviteInfo?.id || '';
        } catch {}

        // Masuk ke grup via invite code jika belum bergabung
        try {
          const joinedJid = await sock.groupAcceptInvite(inviteCode);
          if (joinedJid) targetJid = joinedJid;
        } catch (joinErr) {
          // Jika sudah tergabung, abaikan error
          if (!targetJid) {
            return m.reply(`❌ Gagal bergabung ke grup: ${joinErr.message}`);
          }
        }

        if (!targetJid.endsWith('@g.us')) {
          targetJid = targetJid + '@g.us';
        }

      } catch (err) {
        return m.reply(`❌ Terjadi kesalahan saat memproses link grup: ${err.message}`);
      }
    } else if (m.isGroup) {
      targetJid = m.chat;
      groupSubject = groupMetadata?.subject || 'Grup Ini';
    } else {
      return m.reply(
        `⚠️ Mohon sertakan link grup WhatsApp!\n` +
        `Contoh: \`${config.prefix}addsewa ${days} https://chat.whatsapp.com/...\``
      );
    }

    // Daftarkan status sewa ke database
    const groupData = db.addSewa(targetJid, days, groupSubject);

    // Kirim pesan perkenalan & konfirmasi ke grup yang disewa
    try {
      await sock.sendMessage(targetJid, {
        text:
          `🎉 *STATUS SEWA BOT DIAKTIFKAN!*\n\n` +
          `Halo member *${groupSubject}*! Bot *${config.botName}* kini aktif untuk melayani grup ini.\n\n` +
          `📋 *Detail Sewa Grup:*\n` +
          `• ⏱️ Masa Sewa    : *${days} Hari*\n` +
          `• ⏳ Kedaluwarsa  : *${formatDateWIB(groupData.rentExpires)}*\n` +
          `• 👑 Disewakan Oleh: *Owner Bot*\n\n` +
          `Ketik \`${config.prefix}menu\` untuk mulai mengeksplorasi seluruh fitur bot!`
      });
    } catch {}

    await m.react('✅');
    return m.reply(
      `✅ *BERHASIL MENYEWAKAN BOT!*\n\n` +
      `• 🏷️ Nama Grup   : *${groupSubject}*\n` +
      `• 🆔 JID Grup    : \`${targetJid}\`\n` +
      `• ⏱️ Tambah Sewa : *+${days} Hari*\n` +
      `• ⏳ Total Waktu : *${formatDuration(groupData.rentExpires - Date.now())}*\n` +
      `• 📅 Kedaluwarsa : *${formatDateWIB(groupData.rentExpires)}*`
    );
  }
};
