/**
 * Command: delsewa
 * Menghapus status sewa bot di grup & bot otomatis keluar dari grup
 */

const config = require('../../config');
const { db } = require('../../lib/database');

module.exports = {
  name: 'delsewa',
  aliases: ['hapussewa', 'stopsewa'],
  category: 'owner',
  description: 'Menghentikan sewa bot di grup & otomatis keluar dari grup',
  usage: '<jid / link / kosongkan jika di dalam grup>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ sock, m, args }) => {
    let targetJid = m.isGroup ? m.chat : '';

    if (args[0]) {
      if (args[0].includes('@g.us')) {
        targetJid = args[0];
      } else if (args[0].includes('chat.whatsapp.com')) {
        const match = args[0].match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,26})/i);
        if (match) {
          try {
            const info = await sock.groupGetInviteInfo(match[1]);
            if (info?.id) {
              targetJid = info.id.endsWith('@g.us') ? info.id : `${info.id}@g.us`;
            }
          } catch {}
        }
      }
    }

    if (!targetJid) {
      return m.reply(
        `💡 *Cara Menghentikan Sewa Bot:*\n\n` +
        `• Di dalam grup langsung: Ketik \`${config.prefix}delsewa\`\n` +
        `• Di private chat: Ketik \`${config.prefix}delsewa <jid_grup / link_grup>\``
      );
    }

    const group = db.getGroup(targetJid);
    const groupName = group?.name || 'Grup';

    // Hapus status sewa dari database
    db.delSewa(targetJid);

    // Kirim pesan perpisahan ke grup bahwa sewa dihentikan oleh owner
    try {
      await sock.sendMessage(targetJid, {
        text:
          `👋 *STATUS SEWA DIHENTIKAN OLEH OWNER!*\n\n` +
          `Status sewa bot di grup *${groupName}* telah dihentikan oleh Owner Bot.\n` +
          `Bot akan *otomatis keluar* dari grup ini sekarang.\n\n` +
          `Terima kasih telah menggunakan layanan *${config.botName}*! 🙏\n` +
          `Untuk menyewa kembali, hubungi Owner: *${config.ownerName}*`
      });

      // Tunggu 2.5 detik agar pesan pamit sampai ke semua member
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Otomatis keluar dari grup
      if (typeof sock.groupLeave === 'function') {
        await sock.groupLeave(targetJid);
      }
    } catch (err) {
      // Jika bot sudah tidak di dalam grup atau gagal kirim
    }

    // Jika perintah dijalankan dari luar grup (misal di PC oleh Owner)
    if (m.chat !== targetJid) {
      return m.reply(
        `✅ *STATUS SEWA BERHASIL DIHENTIKAN!*\n\n` +
        `• Nama Grup : *${groupName}*\n` +
        `• JID Grup  : \`${targetJid}\`\n` +
        `• Status    : Sewa dihapus & bot telah *otomatis keluar* dari grup.`
      );
    }
  }
};
