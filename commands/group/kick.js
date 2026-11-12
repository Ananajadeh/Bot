/**
 * Command: kick
 * Mengeluarkan member dari grup
 */

module.exports = {
  name: 'kick',
  aliases: ['tendang', 'remove', 'kickmember'],
  category: 'group',
  description: 'Mengeluarkan anggota dari grup',
  usage: '<tag @user / reply pesan / nomor>',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: true,
  ownerOnly: false,

  execute: async ({ sock, m, args, groupMetadata }) => {
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
      return m.reply('⚠️ Harap tag member, reply pesannya, atau masukkan nomor yang ingin dikeluarkan!');
    }

    // Cek apakah target adalah bot itu sendiri
    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    if (target === botJid) {
      return m.reply('❌ Bot tidak dapat mengeluarkan dirinya sendiri!');
    }

    // Cek apakah target adalah admin grup
    const participants = groupMetadata?.participants || [];
    const targetMember = participants.find((p) => p.id === target);
    if (targetMember && (targetMember.admin === 'admin' || targetMember.admin === 'superadmin')) {
      return m.reply('❌ Tidak dapat mengeluarkan sesama Admin grup!');
    }

    try {
      await sock.groupParticipantsUpdate(m.chat, [target], 'remove');
      await m.reply(`👋 Berhasil mengeluarkan @${target.split('@')[0]} dari grup.`, {
        mentions: [target]
      });
    } catch (err) {
      await m.reply(`❌ Gagal mengeluarkan member: ${err.message}`);
    }
  }
};
