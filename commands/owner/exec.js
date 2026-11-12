/**
 * Command: exec
 * Mengeksekusi perintah shell / terminal Linux (Khusus Owner)
 */

const { exec } = require('child_process');

module.exports = {
  name: 'exec',
  aliases: ['$', 'sh'],
  category: 'owner',
  description: 'Mengeksekusi perintah terminal shell Linux',
  usage: '<command shell>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m, text }) => {
    if (!text) {
      return m.reply('⚠️ Masukkan perintah terminal!\nContoh: `.exec uptime`');
    }

    await m.reply('⏳ Menjalankan perintah...');

    exec(text, (err, stdout, stderr) => {
      if (err) {
        return m.reply(`❌ Error:\n${err.message}`);
      }
      if (stderr) {
        return m.reply(`⚠️ Stderr:\n${stderr}`);
      }
      m.reply(stdout ? stdout : '✅ Perintah berhasil dijalankan tanpa output.');
    });
  }
};
