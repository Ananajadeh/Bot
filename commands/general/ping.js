/**
 * Command: ping
 * Menguji kecepatan respon bot
 */

module.exports = {
  name: 'ping',
  aliases: ['speed', 'p'],
  category: 'general',
  description: 'Mengecek kecepatan respon dan latensi bot',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m }) => {
    const start = Date.now();
    await m.reply('🏓 Pong!');
    const latency = Date.now() - start;
    await m.reply(`⚡ *Kecepatan Respon:* \`${latency} ms\``);
  }
};
