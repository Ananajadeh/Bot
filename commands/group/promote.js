/**
 * Command: promote
 * Mengangkat member menjadi Admin grup
 */

module.exports = {
  name: 'promote',
  aliases: ['admin', 'promoteadmin', 'naikkan'],
  category: 'group',
  description: 'Menaikkan jabatan member menjadi Admin grup',
  usage: '<tag @user / reply pesan>',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: true,
  ownerOnly: false,

  execute: async ({ sock, m, groupMetadata }) => {
    let target = null;

    if (m.mentionedJid && m.mentionedJid.length > 0) {
      target = m.mentionedJid[0];
    } else if (m.quoted && m.quoted.sender) {
      target = m.quoted.sender;
    }

    if (!target) {
      return m.reply('⚠️ Harap tag atau reply pesan member yang ingin dijadikan Admin!');
    }

    const participants = groupMetadata?.participants || [];
    const targetMember = participants.find((p) => p.id === target);

    if (targetMember && (targetMember.admin === 'admin' || targetMember.admin === 'superadmin')) {
      return m.reply('ℹ️ Member tersebut sudah menjadi Admin grup.');
    }

    try {
      await sock.groupParticipantsUpdate(m.chat, [target], 'promote');
      await m.reply(`🎉 Selamat @${target.split('@')[0]}, Anda telah dinaikkan menjadi Admin grup!`, {
        mentions: [target]
      });
    } catch (err) {
      await m.reply(`❌ Gagal menaikkan jabatan: ${err.message}`);
    }
  }
};
