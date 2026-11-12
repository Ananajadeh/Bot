/**
 * Command: add
 * Menambahkan member ke grup melalui nomor telepon
 */

module.exports = {
  name: 'add',
  aliases: ['tambah', 'addmember'],
  category: 'group',
  description: 'Menambahkan anggota baru ke grup',
  usage: '<nomor telepon, contoh: 628xxx atau 08xxx>',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: true,
  ownerOnly: false,

  execute: async ({ sock, m, args }) => {
    let num = args[0] ? args[0].replace(/[^0-9]/g, '') : null;
    if (m.quoted && m.quoted.sender) {
      num = m.quoted.sender.split('@')[0];
    }

    if (!num) {
      return m.reply('⚠️ Masukkan nomor yang ingin ditambahkan!\nContoh: `.add 628123456789`');
    }

    if (num.startsWith('0')) {
      num = '62' + num.slice(1);
    }

    const targetJid = num + '@s.whatsapp.net';

    try {
      const res = await sock.groupParticipantsUpdate(m.chat, [targetJid], 'add');
      const status = res[0]?.status;

      if (status === '200') {
        await m.reply(`✅ Berhasil menambahkan @${num} ke grup.`, {
          mentions: [targetJid]
        });
      } else if (status === '403') {
        // Jika privasi user tidak mengizinkan penambahan langsung, kirim link undangan
        const code = await sock.groupInviteCode(m.chat);
        await m.reply(
          `⚠️ Nomor @${num} memiliki setelan privasi grup. Mengirim link undangan melalui chat pribadi...`,
          { mentions: [targetJid] }
        );
        await sock.sendMessage(targetJid, {
          text: `Halo, Anda diundang untuk bergabung ke grup via link:\nhttps://chat.whatsapp.com/${code}`
        });
      } else if (status === '409') {
        await m.reply(`ℹ️ Nomor @${num} sudah berada di dalam grup ini.`, {
          mentions: [targetJid]
        });
      } else {
        await m.reply(`⚠️ Status penambahan: ${status || 'Tidak diketahui'}`);
      }
    } catch (err) {
      await m.reply(`❌ Gagal menambahkan member: ${err.message}`);
    }
  }
};
