/**
 * Command: demote
 * Menurunkan jabatan Admin menjadi member biasa
 */

module.exports = {
  name: 'demote',
  aliases: ['unadmin', 'demoteadmin', 'turunkan'],
  category: 'group',
  description: 'Menurunkan jabatan Admin menjadi member biasa',
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
      return m.reply('⚠️ Harap tag atau reply pesan Admin yang ingin diturunkan jabatannya!');
    }

    const participants = groupMetadata?.participants || [];
    const targetMember = participants.find((p) => p.id === target);

    if (targetMember && targetMember.admin === 'superadmin') {
      return m.reply('❌ Tidak dapat menurunkan pembuat grup (Superadmin)!');
    }

    if (!targetMember || (!targetMember.admin)) {
      return m.reply('ℹ️ Member tersebut memang bukan Admin grup.');
    }

    try {
      await sock.groupParticipantsUpdate(m.chat, [target], 'demote');
      await m.reply(`📉 @${target.split('@')[0]} telah diturunkan menjadi member biasa.`, {
        mentions: [target]
      });
    } catch (err) {
      await m.reply(`❌ Gagal menurunkan jabatan: ${err.message}`);
    }
  }
};
