/**
 * Command: restart
 * Memulai ulang proses bot
 */

module.exports = {
  name: 'restart',
  aliases: ['reboot'],
  category: 'owner',
  description: 'Memulai ulang (restart) sistem bot',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m }) => {
    await m.reply('🔄 Sedang merestart bot...');
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }
};
