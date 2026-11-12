/**
 * Command: menu / help / bantuan
 * Menampilkan daftar perintah bot dengan 3 pilihan gaya tampilan yang dapat diatur oleh Owner
 * Dilengkapi dengan banner preview grup resmi (externalAdReply)
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config');
const { getAllCommands, getCategories } = require('../../lib/loader');
const { db } = require('../../lib/database');
const { renderMenu, formatUptime } = require('../../lib/menuStyle');

function getThumbnailBuffer() {
  const thumbPath = path.join(__dirname, '../../data/menu_thumb.jpg');
  if (fs.existsSync(thumbPath)) {
    try {
      return fs.readFileSync(thumbPath);
    } catch {}
  }
  const originalPath = path.join(__dirname, '../../data/menu.jpg');
  if (fs.existsSync(originalPath)) {
    try {
      return fs.readFileSync(originalPath);
    } catch {}
  }
  return null;
}

module.exports = {
  name: 'menu',
  aliases: ['help', 'bantuan'],
  category: 'general',
  description: 'Menampilkan daftar menu perintah bot',
  usage: '[nomor_style / kategori]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args }) => {
    const uptime = formatUptime(process.uptime());
    const allCmds = getAllCommands();
    const categories = getCategories();
    const user = db.getUser(m.senderNumber, m.pushName);

    // Tentukan status user dan limit
    let statusUser = 'Free Member';
    let userLimit = `${user.limit} / 5`;

    if (m.isOwner) {
      statusUser = 'Owner Bot 👑';
      userLimit = 'Unlimited (∞)';
    } else if (user.premium) {
      statusUser = 'Premium Member ⭐';
      userLimit = `${user.limit} / 50`;
    }

    // Tentukan gaya menu yang digunakan:
    // Prioritas: Argumen spesifik 1/2/3 jika dicantumkan, jika tidak gunakan setting database/config
    let activeStyleId = db.getMenuType() || config.menuType || 1;
    let selectedCategory = null;

    if (args && args[0]) {
      const argVal = args[0].toLowerCase();
      if (['1', '2', '3'].includes(argVal)) {
        activeStyleId = parseInt(argVal, 10);
      } else {
        // Cek apakah argumen adalah nama kategori yang valid
        const matchCat = categories.find((c) => c.toLowerCase() === argVal);
        if (matchCat) {
          selectedCategory = matchCat;
        }
      }
    }

    // Render teks menu sesuai gaya aktif
    const menuText = renderMenu({
      styleId: activeStyleId,
      botName: config.botName,
      ownerName: config.ownerName,
      userName: m.pushName || 'User',
      statusUser,
      userLimit,
      uptime,
      prefix: config.prefix,
      groupLink: config.groupLink,
      allCommands: allCmds,
      selectedCategory
    });

    const thumbBuffer = getThumbnailBuffer();

    const contextInfo = {
      externalAdReply: {
        title: `${config.botName.toUpperCase()} • MENU`,
        body: '👉 Ketuk Di Sini Untuk Bergabung ke Grup 👈',
        mediaType: 1,
        renderLargerThumbnail: true,
        showAdAttribution: true,
        sourceUrl: config.groupLink,
        thumbnailUrl: config.menuImage,
        ...(thumbBuffer ? { thumbnail: thumbBuffer } : {})
      }
    };

    if (sock && typeof sock.sendMessage === 'function') {
      const sendAdReply = async () => {
        try {
          return await sock.sendMessage(m.chat, { text: menuText, contextInfo }, { quoted: m });
        } catch {
          return await sock.sendMessage(m.chat, { text: menuText, contextInfo });
        }
      };

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout externalAdReply')), 8000)
      );

      try {
        await Promise.race([sendAdReply(), timeoutPromise]);
        return;
      } catch (err) {
        // Fallback jika pengiriman contextInfo terkendala
      }
    }

    await m.reply(menuText);
  }
};
