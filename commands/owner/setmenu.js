/**
 * Command: setmenu / setmenu1 / setmenu2 / setmenu3
 * Mengatur tampilan menu bot langsung lewat WhatsApp (Khusus Owner Bot)
 */

const config = require('../../config');
const { db } = require('../../lib/database');
const { saveCustomMenu, removeCustomMenu } = require('../../lib/menuHelper');

module.exports = {
  name: 'setmenu',
  aliases: [
    'setmenu1', 'setmenu2', 'setmenu3', 'setmenu4', 'setmenu5',
    'delmenu', 'delmenu1', 'delmenu2', 'delmenu3',
    'ubahmenu', 'gantimenu', 'listmenu', 'cekmenu'
  ],
  category: 'owner',
  description: 'Mengatur tampilan Menu 1, Menu 2, Menu 3 bot langsung lewat WhatsApp',
  usage: '<1/2/3/active/del> [teks menu]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ sock, m, args, text, command }) => {
    const cmd = (command || '').toLowerCase();
    const prefix = config.prefix || '.';

    // 1. Tentukan nomor slot tampilan menu
    let slot = null;
    let isDelete = false;

    if (cmd.startsWith('setmenu')) {
      const match = cmd.match(/^setmenu(\d+)$/);
      if (match) slot = match[1];
    } else if (cmd.startsWith('delmenu')) {
      isDelete = true;
      const match = cmd.match(/^delmenu(\d+)$/);
      if (match) slot = match[1];
    }

    let action = (args[0] || '').toLowerCase();

    // Cek aksi khusus: active / pilih / del / hapus / reset / list
    if (action === 'active' || action === 'pilih' || action === 'default') {
      const targetSlot = (args[1] || action).toLowerCase();
      if (targetSlot === 'default' || targetSlot === 'standar') {
        db.setActiveMenu('default');
        return m.reply(
          `✅ *TAMPILAN MENU AKTIF DIUBAH!*\n\n` +
          `Perintah \`${prefix}menu\` sekarang akan menampilkan *Menu Default Otomatis*.`
        );
      } else if (/^\d+$/.test(targetSlot)) {
        const custom = db.getCustomMenu(targetSlot);
        if (!custom) {
          return m.reply(
            `⚠️ Tampilan Menu ${targetSlot} belum pernah dibuat / masih kosong!\n` +
            `Silakan atur terlebih dahulu dengan: \`${prefix}setmenu${targetSlot} <teks menu>\``
          );
        }
        db.setActiveMenu(targetSlot);
        return m.reply(
          `✅ *TAMPILAN MENU AKTIF DIUBAH!*\n\n` +
          `Perintah \`${prefix}menu\` sekarang akan otomatis menampilkan *Tampilan Menu ${targetSlot}*.\n` +
          `Ketik \`${prefix}menu\` atau \`${prefix}menu${targetSlot}\` untuk melihat hasilnya.`
        );
      } else {
        return m.reply(
          `⚠️ Tentukan nomor tampilan yang ingin dijadikan default:\n` +
          `• \`${prefix}setmenu active 1\` (Pilih Menu 1)\n` +
          `• \`${prefix}setmenu active 2\` (Pilih Menu 2)\n` +
          `• \`${prefix}setmenu active 3\` (Pilih Menu 3)\n` +
          `• \`${prefix}setmenu active default\` (Kembali ke bawaan bot)`
        );
      }
    }

    if (action === 'del' || action === 'hapus' || action === 'reset') {
      isDelete = true;
      if (args[1] && /^\d+$/.test(args[1])) {
        slot = args[1];
      }
    }

    // Jika slot belum ditentukan dari command (misal: .setmenu 1 <teks>)
    if (!slot && args[0] && /^\d+$/.test(args[0])) {
      slot = args[0];
      // Hapus slot dari teks agar tidak ikut tersimpan
      text = text.replace(/^\d+\s*/, '').trim();
    }

    // 2. Logika Hapus Menu
    if (isDelete) {
      if (!slot) {
        return m.reply(`⚠️ Tentukan nomor menu yang ingin dihapus!\nContoh: \`${prefix}delmenu 1\` atau \`${prefix}setmenu del 1\``);
      }
      const success = removeCustomMenu(slot);
      if (success) {
        return m.reply(`✅ *Tampilan Menu ${slot} berhasil dihapus/direset!*`);
      } else {
        return m.reply(`ℹ️ Tampilan Menu ${slot} memang belum pernah diatur.`);
      }
    }

    // 3. Jika tidak ada slot yang diatur dan teks kosong: Tampilkan Dashboard Status Menu
    if (!slot) {
      const allCustom = db.getAllCustomMenus();
      const active = db.getActiveMenu();

      let dashboard = `╭━━━「 *PENGATURAN MENU BOT* 」━━━\n`;
      dashboard += `┃ 👑 *Owner:* ${config.ownerName}\n`;
      dashboard += `┃ 🎯 *Menu Aktif Saat Ini:* ${active === 'default' ? 'Default (Bawaan)' : `Tampilan Menu ${active} ✅`}\n`;
      dashboard += `╰━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      dashboard += `📋 *STATUS TAMPILAN MENU:*\n`;
      for (let i = 1; i <= 3; i++) {
        const item = allCustom[String(i)];
        const status = item ? `Tersedia ✅ ${item.hasImage ? '(+Gambar)' : ''}` : `Belum Diatur ❌`;
        dashboard += `• *Tampilan ${i}* (\`${prefix}menu${i}\`): ${status}\n`;
      }

      dashboard += `\n⚙️ *CARA MENGATUR TAMPILAN MENU:*\n`;
      dashboard += `1️⃣ *Kirim Langsung:*\n`;
      dashboard += `   \`${prefix}setmenu1 <Ketik teks menu full di sini>\`\n\n`;
      dashboard += `2️⃣ *Balas (Reply) Pesan:*\n`;
      dashboard += `   Kirim teks menu panjang / gambar di chat, lalu balas pesan tersebut dengan ketik \`${prefix}setmenu1\`\n\n`;
      dashboard += `3️⃣ *Memilih Menu Default:*\n`;
      dashboard += `   \`${prefix}setmenu active 1\` (Agar \`${prefix}menu\` menampilkan Menu 1)\n\n`;
      dashboard += `4️⃣ *Mereset Menu:*\n`;
      dashboard += `   \`${prefix}delmenu 1\` (Menghapus Menu 1)\n\n`;
      dashboard += `✨ *Placeholder Otomatis (Opsional):*\n`;
      dashboard += `\`%name%\` (Nama User), \`%tag%\` (Mention), \`%limit%\` (Sisa Limit), \`%status%\` (Role), \`%time%\` (Waktu), \`%date%\` (Tanggal), \`%prefix%\`, \`%botname%\`, \`%totalcmd%\``;

      return m.reply(dashboard);
    }

    // 4. Ambil isi teks menu dari pesan langsung atau pesan yang dibalas (quoted)
    let fullMenuText = '';
    let imageBuffer = null;

    // Cek apakah pesan yang dibalas berisi media gambar
    if (m.quoted && m.quoted.type === 'imageMessage') {
      imageBuffer = await m.download();
      fullMenuText = text || m.quoted.text || '';
    } else if (m.type === 'imageMessage') {
      imageBuffer = await m.download();
      fullMenuText = text || '';
    } else if (m.quoted && m.quoted.text) {
      fullMenuText = text || m.quoted.text || '';
    } else {
      fullMenuText = text || '';
    }

    fullMenuText = fullMenuText.trim();

    if (!fullMenuText && !imageBuffer) {
      return m.reply(
        `⚠️ Masukkan teks isi menu full yang ingin disimpan untuk *Tampilan Menu ${slot}*!\n\n` +
        `*Contoh:* \`${prefix}setmenu${slot} Halo selamat datang di bot kami...\`\n` +
        `_atau balas (reply) pesan yang berisi teks menu dengan \`${prefix}setmenu${slot}\`._`
      );
    }

    await m.react('⏳');

    try {
      await saveCustomMenu(slot, fullMenuText, imageBuffer);

      await m.react('✅');
      return m.reply(
        `🎉 *TAMPILAN MENU ${slot} BERHASIL DISIMPAN!*\n\n` +
        `◦ *Nomor Slot :* Tampilan Menu ${slot}\n` +
        `◦ *Media      :* ${imageBuffer ? 'Foto / Gambar Disimpan ✅' : 'Hanya Teks'}\n` +
        `◦ *Status     :* Siap Digunakan ✅\n\n` +
        `📌 *Cara Cek Menu:*\n` +
        `Ketik \`${prefix}menu${slot}\` (atau \`${prefix}menu ${slot}\`) di obrolan.\n\n` +
        `📌 *Jadikan Menu Utama:*\n` +
        `Ketik \`${prefix}setmenu active ${slot}\` jika ingin \`${prefix}menu\` langsung menampilkan tampilan ini.`
      );
    } catch (err) {
      await m.react('❌');
      return m.reply(`❌ Gagal menyimpan Tampilan Menu ${slot}: ${err.message}`);
    }
  }
};
