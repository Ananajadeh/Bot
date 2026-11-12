/**
 * Command: unblock
 * Membuka blokir nomor pengguna di WhatsApp bot
 */

module.exports = {
  name: 'unblock',
  aliases: ['bukablokir'],
  category: 'owner',
  description: 'Membuka blokir kontak pengguna di WhatsApp',
  usage: '<tag @user / reply pesan / nomor>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ sock, m, args }) => {
    let target = null;

    if (m.mentionedJid && m.mentionedJid.length > 0) {
      target = m.mentionedJid[0];
    } else if (m.quoted && m.quoted.sender) {
      target = m.quoted.sender;
    } else if (args[0]) {
      let num = args[0].replace(/[^0-9]/g, '');
      if (num.startsWith('0')) num = '62' + num.slice(1);
      target = num + '@s.whatsapp.net';
    }

    if (!target) {
      return m.reply('⚠️ Tag kontak, reply pesannya, atau masukkan nomor yang ingin dibuka blokirnya!');
    }

    try {
      await sock.updateBlockStatus(target, 'unblock');
      await m.reply(`✅ Blokir untuk @${target.split('@')[0]} berhasil dibuka.`, {
        mentions: [target]
      });
    } catch (err) {
      await m.reply(`❌ Gagal membuka blokir: ${err.message}`);
    }
  }
};
