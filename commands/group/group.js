/**
 * Command: group
 * Mengatur setelan buka / tutup grup (hanya admin yang dapat kirim pesan)
 */

module.exports = {
  name: 'group',
  aliases: ['grup', 'opengroup', 'closegroup', 'buka', 'tutup', 'bukagrup', 'tutupgrup'],
  category: 'group',
  description: 'Membuka atau menutup grup (hanya admin kirim pesan)',
  usage: '<open / close>',
  groupOnly: true,
  adminOnly: true,
  botAdminOnly: true,
  ownerOnly: false,

  execute: async ({ sock, m, args, command }) => {
    let action = (args[0] || '').toLowerCase();
    const cmd = (command || '').toLowerCase();

    if (cmd === 'opengroup' || cmd === 'buka' || cmd === 'bukagrup') {
      action = 'open';
    } else if (cmd === 'closegroup' || cmd === 'tutup' || cmd === 'tutupgrup') {
      action = 'close';
    }

    if (action === 'open' || action === 'buka') {
      try {
        await sock.groupSettingUpdate(m.chat, 'not_announcement');
        await m.reply('🔓 *Grup telah dibuka!* Sekarang semua anggota dapat mengirim pesan.');
      } catch (err) {
        await m.reply(`❌ Gagal membuka grup: ${err.message}`);
      }
    } else if (action === 'close' || action === 'tutup') {
      try {
        await sock.groupSettingUpdate(m.chat, 'announcement');
        await m.reply('🔒 *Grup telah ditutup!* Sekarang hanya admin yang dapat mengirim pesan.');
      } catch (err) {
        await m.reply(`❌ Gagal menutup grup: ${err.message}`);
      }
    } else {
      await m.reply(
        '⚠️ Pilih opsi yang valid:\n' +
        '• `.group open` atau `.opengroup` (Buka grup)\n' +
        '• `.group close` atau `.closegroup` (Tutup grup)'
      );
    }
  }
};
