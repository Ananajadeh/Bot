/**
 * Command: eval
 * Mengeksekusi kode JavaScript langsung dari chat (Khusus Owner)
 */

const util = require('util');

module.exports = {
  name: 'eval',
  aliases: ['ev', '>', '=>'],
  category: 'owner',
  description: 'Mengevaluasi kode JavaScript (Live execution)',
  usage: '<kode javascript>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ sock, m, text, args, groupMetadata, isOwner, isAdmin, isBotAdmin }) => {
    if (!text) {
      return m.reply('⚠️ Masukkan kode JavaScript yang ingin dieksekusi!\nContoh: `.eval 1 + 1`');
    }

    let code = text;
    // Jika diawali => bungkus dengan return
    if (code.startsWith('=>')) {
      code = `(async () => { return ${code.slice(2)} })()`;
    }

    try {
      let evaled = await eval(code);
      if (typeof evaled !== 'string') {
        evaled = util.inspect(evaled, { depth: 2 });
      }
      await m.reply(evaled);
    } catch (err) {
      await m.reply(`❌ Evaluasi Gagal:\n${util.format(err)}`);
    }
  }
};
