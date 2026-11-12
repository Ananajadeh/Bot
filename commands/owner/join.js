/**
 * Command: join
 * Memasukkan bot ke grup melalui link undangan
 */

module.exports = {
  name: 'join',
  aliases: ['gabung'],
  category: 'owner',
  description: 'Memasukkan bot ke dalam grup lewat link undangan',
  usage: '<link grup whatsapp>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ sock, m, args }) => {
    const link = args[0];

    if (!link) {
      return m.reply('⚠️ Masukkan link undangan grup!\nContoh: `.join https://chat.whatsapp.com/ABC123xyz`');
    }

    const regex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
    const match = link.match(regex);

    if (!match) {
      return m.reply('❌ Link grup WhatsApp tidak valid!');
    }

    const code = match[1];

    try {
      await m.reply('⏳ Sedang mencoba bergabung ke grup...');
      const res = await sock.groupAcceptInvite(code);
      await m.reply(`✅ Berhasil bergabung ke grup! (ID: ${res})`);
    } catch (err) {
      await m.reply(`❌ Gagal bergabung ke grup: ${err.message}`);
    }
  }
};
