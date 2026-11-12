/**
 * Command: menu / help / menu1 / menu2 / menu3
 * Menampilkan menu bot WhatsApp (Mendukung Menu Default & Tampilan Kustom Owner)
 */

const config = require('../../config');
const { db } = require('../../lib/database');
const { sendCustomMenu, sendDefaultMenu } = require('../../lib/menuHelper');

module.exports = {
  name: 'menu',
  aliases: [
    'help', 'commands', 'list',
    'menu1', 'menu2', 'menu3', 'menu4', 'menu5',
    'tampilan1', 'tampilan2', 'tampilan3'
  ],
  category: 'general',
  description: 'Menampilkan daftar menu dan command bot',
  usage: '[kategori / 1 / 2 / 3 / default]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, text, command, user }) => {
    try {
      await m.react('⏳');

      const prefix = config.prefix || '.';
      const cmdLower = (command || '').toLowerCase();
      let requestedSlot = null;

      // 1. Deteksi apakah perintah adalah .menu1, .menu2, .menu3, dst.
      const match = cmdLower.match(/^(?:menu|tampilan)(\d+)$/);
      if (match) {
        requestedSlot = match[1];
      } else if (args[0] && /^\d+$/.test(args[0])) {
        // Misal: .menu 1 atau .menu 2
        requestedSlot = args[0];
      }

      // 2. Jika meminta slot menu tertentu (.menu1, .menu2, .menu3, atau .menu 1)
      if (requestedSlot) {
        const custom = db.getCustomMenu(requestedSlot);
        if (!custom || !custom.text) {
          await m.react('ℹ️');
          return m.reply(
            `⚠️ *TAMPILAN MENU ${requestedSlot} BELUM DIATUR!*\n\n` +
            `Owner dapat mengaturnya melalui WhatsApp dengan mengetik:\n` +
            `\`${prefix}setmenu${requestedSlot} <isi menu full di sini>\`\n` +
            `_atau balas (reply) pesan menu dengan ketik \`${prefix}setmenu${requestedSlot}\`._\n\n` +
            `📌 Ketik \`${prefix}menu\` untuk melihat menu utama saat ini.`
          );
        }

        await sendCustomMenu(sock, m, requestedSlot, user);
        await m.react('✅');
        return;
      }

      // 3. Cek apakah pengguna meminta menu bawaan / kategori tertentu
      const firstArg = (args[0] || '').toLowerCase();

      if (firstArg === 'default' || firstArg === 'all' || firstArg === 'standar') {
        // Tampilkan menu default otomatis tanpa filter
        await sendDefaultMenu(sock, m, null);
        await m.react('✅');
        return;
      }

      // Jika argumen berupa nama kategori (dan bukan slot angka)
      if (firstArg && !/^\d+$/.test(firstArg)) {
        await sendDefaultMenu(sock, m, firstArg);
        await m.react('✅');
        return;
      }

      // 4. Perintah .menu standar: Periksa apakah owner telah memilih menu kustom aktif
      const activeSlot = db.getActiveMenu();

      if (activeSlot && activeSlot !== 'default') {
        const custom = db.getCustomMenu(activeSlot);
        if (custom && custom.text) {
          await sendCustomMenu(sock, m, activeSlot, user);
          await m.react('✅');
          return;
        }
      }

      // 5. Fallback ke Menu Default terstruktur otomatis
      await sendDefaultMenu(sock, m, null);
      await m.react('✅');
    } catch (err) {
      console.error('[MENU ERROR]', err);
      await m.react('❌');
      await m.reply(`❌ Terjadi kesalahan saat menampilkan menu: ${err.message}`);
    }
  }
};
