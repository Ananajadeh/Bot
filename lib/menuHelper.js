/**
 * Menu Helper & Custom Layout Manager
 * Mengelola Tampilan Menu 1, Tampilan Menu 2, Tampilan Menu 3, dan Menu Default
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { db, formatDuration } = require('./database');
const { getAllCommands } = require('./loader');

const CUSTOM_MENU_DIR = path.resolve(__dirname, '../data/custom_menus');

// Pastikan direktori penyimpanan gambar menu ada
if (!fs.existsSync(CUSTOM_MENU_DIR)) {
  fs.mkdirSync(CUSTOM_MENU_DIR, { recursive: true });
}

function getMenuImagePath(slotId) {
  return path.join(CUSTOM_MENU_DIR, `menu_${slotId}.jpg`);
}

/**
 * Mengganti variabel/placeholder pada teks menu kustom
 */
function renderPlaceholders(templateText, { m, user, totalCommands, totalCategories, categories }) {
  if (!templateText) return '';

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB';
  const dateStr = now.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const uptimeMs = process.uptime() * 1000;
  const uptimeStr = formatDuration(uptimeMs);

  const prefix = config.prefix || '.';
  const botName = config.botName || 'nayxilaa md';
  const ownerName = config.ownerName || 'AnanOFC';
  const rawOwner = Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : config.ownerNumber;
  const ownerNum = String(rawOwner || '').replace(/[^0-9]/g, '');

  let rendered = templateText;

  // Placeholder standar
  rendered = rendered.replace(/%user%|%name%/gi, m.pushName || 'User');
  rendered = rendered.replace(/%tag%|%sender%/gi, `@${m.senderNumber}`);
  rendered = rendered.replace(/%prefix%/gi, prefix);
  rendered = rendered.replace(/%botname%/gi, botName);
  rendered = rendered.replace(/%ownername%/gi, ownerName);
  rendered = rendered.replace(/%ownernumber%/gi, ownerNum);
  rendered = rendered.replace(/%limit%/gi, String(user?.limit ?? '-'));
  rendered = rendered.replace(/%status%|%role%/gi, user?.premium ? 'Premium 👑' : 'Free 👤');
  rendered = rendered.replace(/%time%/gi, timeStr);
  rendered = rendered.replace(/%date%/gi, dateStr);
  rendered = rendered.replace(/%uptime%|%runtime%/gi, uptimeStr);
  rendered = rendered.replace(/%totalcommands%|%totalcmd%/gi, String(totalCommands || 0));
  rendered = rendered.replace(/%totalcategories%|%totalcat%/gi, String(totalCategories || 0));

  // Placeholder otomatis jika owner ingin daftar kategori & command ditempel (%allcommands% / %commands%)
  if (/%allcommands%|%commands%/i.test(rendered) && categories) {
    const sortedCatNames = Object.keys(categories).sort((a, b) => a.localeCompare(b));
    const blocks = [];
    for (const cat of sortedCatNames) {
      const cmds = categories[cat].sort((a, b) => a.name.localeCompare(b.name));
      let block = `╭─「 *${cat.toUpperCase()}* 」\n`;
      for (const cmd of cmds) {
        block += `│ ◦ ${prefix}${cmd.name}\n`;
      }
      block += `╰─ ${cmds.length} command`;
      blocks.push(block);
    }
    rendered = rendered.replace(/%allcommands%|%commands%/gi, blocks.join('\n\n'));
  }

  return rendered;
}

/**
 * Mengelompokkan seluruh command yang terdaftar
 */
function getGroupedCommands() {
  let allCommands = getAllCommands();
  if (!allCommands || allCommands.length === 0) {
    if (global.commands instanceof Map) {
      allCommands = Array.from(global.commands.values());
    } else if (Array.isArray(global.commands)) {
      allCommands = global.commands;
    }
  }

  const categories = {};
  const uniqueCommands = new Map();

  for (const cmd of allCommands) {
    if (!cmd || !cmd.name) continue;
    const nameLower = cmd.name.toLowerCase();
    if (uniqueCommands.has(nameLower)) continue;
    uniqueCommands.set(nameLower, cmd);

    const cat = (cmd.category || 'general').toLowerCase();
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cmd);
  }

  return {
    categories,
    totalCommands: uniqueCommands.size,
    totalCategories: Object.keys(categories).length
  };
}

/**
 * Menampilkan Custom Menu (Menu 1, Menu 2, Menu 3, dst.)
 */
async function sendCustomMenu(sock, m, slotId, user) {
  const custom = db.getCustomMenu(slotId);
  if (!custom || !custom.text) {
    return false;
  }

  const { categories, totalCommands, totalCategories } = getGroupedCommands();

  const renderedText = renderPlaceholders(custom.text, {
    m,
    user,
    totalCommands,
    totalCategories,
    categories
  });

  const imgPath = getMenuImagePath(slotId);
  const hasImage = custom.hasImage && fs.existsSync(imgPath);

  const mentions = [m.sender];

  if (hasImage) {
    const imgBuffer = fs.readFileSync(imgPath);
    await sock.sendMessage(
      m.chat,
      {
        image: imgBuffer,
        caption: renderedText,
        mentions
      },
      { quoted: m }
    );
  } else {
    await sock.sendMessage(
      m.chat,
      {
        text: renderedText,
        mentions
      },
      { quoted: m }
    );
  }

  return true;
}

/**
 * Menampilkan Menu Default Terstruktur Otomatis
 */
async function sendDefaultMenu(sock, m, filterCat) {
  const prefix = config.prefix || '.';
  const botName = config.botName || 'NAYXILAA MD';
  const ownerName = config.ownerName || 'AnanOFC';
  const userName = m.pushName || 'Kak';

  const { categories, totalCommands, totalCategories } = getGroupedCommands();
  const sortedCatNames = Object.keys(categories).sort((a, b) => a.localeCompare(b));

  let menuText = '';

  if (filterCat && categories[filterCat]) {
    const cmds = categories[filterCat].sort((a, b) => a.name.localeCompare(b.name));
    menuText += `╭─「 *${filterCat.toUpperCase()}* 」\n`;
    for (const cmd of cmds) {
      menuText += `│ ◦ ${prefix}${cmd.name}\n`;
      if (cmd.description) {
        menuText += `│   └ _${cmd.description}_\n`;
      }
    }
    menuText += `╰─ ${cmds.length} command\n\n`;
    menuText += `📌 Ketik *${prefix}menu* untuk melihat seluruh menu.`;
  } else if (filterCat) {
    menuText += `❌ Kategori *${filterCat}* tidak ditemukan.\n\n`;
    menuText += `📌 Ketik *${prefix}menu* untuk melihat seluruh menu.`;
  } else {
    menuText += `╭─「 *${botName.toUpperCase()}* 」\n`;
    menuText += `│\n`;
    menuText += `│ 👤 Owner : ${ownerName}\n`;
    menuText += `│ 🔰 Prefix : ${prefix}\n`;
    menuText += `│ 📦 Total Command : ${totalCommands}\n`;
    menuText += `│ 📂 Total Kategori : ${totalCategories}\n`;
    menuText += `│\n`;
    menuText += `│ Halo *${userName}*!\n`;
    menuText += `│ Silakan pilih menu di bawah.\n`;
    menuText += `╰──────────────────\n\n`;

    const categoryBlocks = [];
    for (const cat of sortedCatNames) {
      const cmds = categories[cat].sort((a, b) => a.name.localeCompare(b.name));
      let block = `╭─「 *${cat.toUpperCase()}* 」\n`;
      for (const cmd of cmds) {
        block += `│ ◦ ${prefix}${cmd.name}\n`;
      }
      block += `╰─ ${cmds.length} command`;
      categoryBlocks.push(block);
    }

    menuText += categoryBlocks.join('\n\n');
    menuText += `\n\n📌 Ketik *${prefix}menu <kategori>* untuk detail kategori.\n`;
    menuText += `📌 Contoh: *${prefix}menu game*`;
  }

  await sock.sendMessage(m.chat, { text: menuText, mentions: [m.sender] }, { quoted: m });
  return true;
}

/**
 * Menyimpan menu kustom dari owner (lengkap dengan dukungan media gambar)
 */
async function saveCustomMenu(slotId, text, imageBuffer = null) {
  const strId = String(slotId).toLowerCase();
  const hasImage = Boolean(imageBuffer);

  if (hasImage) {
    const imgPath = getMenuImagePath(strId);
    fs.writeFileSync(imgPath, imageBuffer);
  }

  db.setCustomMenu(strId, text, hasImage);
  return true;
}

/**
 * Menghapus menu kustom
 */
function removeCustomMenu(slotId) {
  const strId = String(slotId).toLowerCase();
  const imgPath = getMenuImagePath(strId);
  if (fs.existsSync(imgPath)) {
    try {
      fs.unlinkSync(imgPath);
    } catch {}
  }
  return db.delCustomMenu(strId);
}

module.exports = {
  sendCustomMenu,
  sendDefaultMenu,
  saveCustomMenu,
  removeCustomMenu,
  getGroupedCommands,
  renderPlaceholders
};
