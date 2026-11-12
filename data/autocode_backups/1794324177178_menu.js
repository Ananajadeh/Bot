const config = require('../../config');

module.exports = {
  name: 'menu',
  aliases: ['help', 'bantuan'],
  category: 'general',
  description: 'Menampilkan daftar menu dan command bot',
  usage: '[kategori]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, text, command, groupMetadata, isOwner, isAdmin, isBotAdmin, user }) => {
    try {
      await m.react('📋');

      // Ambil semua command dari cache global bot (fallback ke require manual jika tidak ada)
      let commands = [];
      if (global.commands) {
        if (global.commands instanceof Map) {
          commands = Array.from(global.commands.values());
        } else if (Array.isArray(global.commands)) {
          commands = global.commands;
        } else if (typeof global.commands === 'object') {
          commands = Object.values(global.commands);
        }
      }

      // Fallback: baca dari folder commands secara manual jika cache kosong
      if (!commands.length) {
        const fs = require('fs');
        const path = require('path');
        const baseDir = path.join(__dirname, '..', '..', 'commands');
        const walk = (dir) => {
          let results = [];
          if (!fs.existsSync(dir)) return results;
          const list = fs.readdirSync(dir);
          for (const file of list) {
            const full = path.join(dir, file);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
              results = results.concat(walk(full));
            } else if (file.endsWith('.js')) {
              try {
                const mod = require(full);
                if (mod && mod.name && typeof mod.execute === 'function') {
                  results.push({ name: mod.name, category: mod.category || 'general', description: mod.description || '-', aliases: mod.aliases || [] });
                }
              } catch (e) {
                // skip file yang error
              }
            }
          }
          return results;
        };
        commands = walk(baseDir);
      }

      if (!commands.length) {
        return await m.reply('⚠️ Tidak ada command yang terdaftar saat ini.');
      }

      const prefix = config.prefix || '.';
      const botName = config.botName || 'nayxilaa md';
      const ownerName = config.ownerName || '-';
      const filter = (text || '').trim().toLowerCase();

      // Kelompokkan berdasarkan kategori
      const grouped = {};
      for (const cmd of commands) {
        const cat = (cmd.category || 'general').toLowerCase();
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(cmd);
      }

      const categories = Object.keys(grouped).sort();

      // Jika ada argumen kategori, tampilkan detail kategori tersebut
      if (filter) {
        if (!grouped[filter]) {
          return await m.reply(`❌ Kategori *${filter}* tidak ditemukan.\n\n📂 Kategori tersedia:\n${categories.map(c => `• ${c}`).join('\n')}`);
        }
        const list = grouped[filter].sort((a, b) => a.name.localeCompare(b.name));
        let teks = `╭─「 *MENU ${filter.toUpperCase()}* 」\n`;
        teks += `│\n`;
        for (const cmd of list) {
          teks += `│ ◦ *${prefix}${cmd.name}*\n`;
          if (cmd.description && cmd.description !== '-') teks += `│    ${cmd.description}\n`;
          if (cmd.aliases && cmd.aliases.length) teks += `│    Alias: ${cmd.aliases.map(a => prefix + a).join(', ')}\n`;
        }
        teks += `│\n╰─ Total: ${list.length} command`;
        return await m.reply(teks);
      }

      // Tampilan menu utama (klasik)
      let teks = `╭─「 *${botName.toUpperCase()}* 」\n`;
      teks += `│\n`;
      teks += `│ 👤 Owner : ${ownerName}\n`;
      teks += `│ 🔰 Prefix : ${prefix}\n`;
      teks += `│ 📦 Total Command : ${commands.length}\n`;
      teks += `│ 📂 Total Kategori : ${categories.length}\n`;
      teks += `│\n`;
      teks += `│ Halo *${m.pushName || 'Kak'}*!\n`;
      teks += `│ Silakan pilih menu di bawah.\n`;
      teks += `╰──────────────────\n\n`;

      for (const cat of categories) {
        const list = grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
        teks += `╭─「 *${cat.toUpperCase()}* 」\n`;
        for (const cmd of list) {
          teks += `│ ◦ ${prefix}${cmd.name}\n`;
        }
        teks += `╰─ ${list.length} command\n\n`;
      }

      teks += `📌 Ketik *${prefix}menu <kategori>* untuk detail kategori.\n`;
      teks += `📌 Contoh: *${prefix}menu general*`;

      await m.reply(teks.trim());
    } catch (e) {
      console.error('[MENU ERROR]', e);
      await m.reply('❌ Terjadi kesalahan saat menampilkan menu.\n\n' + (e.message || ''));
    }
  }
};
