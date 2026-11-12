/**
 * Command: mode / public / self
 * Mengatur mode bot (Public: semua orang bisa pakai di grup & privat, Self: hanya owner)
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config');

function saveModeToConfig(newMode) {
  try {
    const configPath = path.resolve(__dirname, '../../config.js');
    let content = fs.readFileSync(configPath, 'utf8');
    content = content.replace(/mode:\s*['"][^'"]+['"]/, `mode: '${newMode}'`);
    fs.writeFileSync(configPath, content, 'utf8');
  } catch (err) {
    console.error('Gagal menulis mode ke config.js:', err.message);
  }
}

module.exports = {
  name: 'mode',
  aliases: ['public', 'self'],
  category: 'owner',
  description: 'Mengatur mode operasi bot (public / self)',
  usage: '<public / self>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m, args, command }) => {
    let targetMode = '';

    if (command === 'public') {
      targetMode = 'public';
    } else if (command === 'self') {
      targetMode = 'self';
    } else if (args[0]) {
      const input = args[0].toLowerCase();
      if (input === 'public' || input === 'self') {
        targetMode = input;
      }
    }

    if (targetMode === 'public') {
      config.mode = 'public';
      saveModeToConfig('public');
      await m.reply('🌐 *Mode bot berhasil diubah ke PUBLIC!*\nSekarang semua orang di grup dan private chat dapat menggunakan bot.');
    } else if (targetMode === 'self') {
      config.mode = 'self';
      saveModeToConfig('self');
      await m.reply('🔒 *Mode bot berhasil diubah ke SELF!*\nSekarang bot hanya merespon perintah dari Owner bot.');
    } else {
      await m.reply(
        `ℹ️ *STATUS MODE BOT*\n` +
        `• Mode Aktif: *${config.mode.toUpperCase()}*\n\n` +
        `*Cara Mengubah Mode:*\n` +
        `• \`.mode public\` atau \`.public\` (Aktif untuk semua orang di grup & privat)\n` +
        `• \`.mode self\` atau \`.self\` (Hanya merespon Owner bot)`
      );
    }
  }
};
