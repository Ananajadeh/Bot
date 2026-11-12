const fs = require('fs');
const path = require('path');
const config = require('../../config');

module.exports = {
  name: 'menu',
  aliases: ['help', 'start'],
  category: 'general',
  description: 'Menampilkan daftar perintah bot dalam tampilan yang simpel dan rapi',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, text, command, groupMetadata, isOwner, isAdmin, isBotAdmin, user }) => {
    try {
      await m.react('✨');

      const botName = config.botName || 'nayxilaa md';
      const ownerName = config.ownerName || 'Owner';
      const prefix = config.prefix || '.';

      // Hitung uptime sederhana
      const uptimeSec = process.uptime();
      const hours = Math.floor(uptimeSec / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const seconds = Math.floor(uptimeSec % 60);
      const uptimeStr = `${hours}j ${minutes}m ${seconds}d`;

      // Scan folder commands untuk mengelompokkan secara otomatis
      const commandsDir = path.join(__dirname, '../');
      let totalCommands = 0;
      const categories = {};

      if (fs.existsSync(commandsDir)) {
        const cats = fs.readdirSync(commandsDir);
        for (const cat of cats) {
          const catPath = path.join(commandsDir, cat);
          if (fs.statSync(catPath).isDirectory()) {
            const files = fs.readdirSync(catPath).filter(file => file.endsWith('.js'));
            if (files.length > 0) {
              categories[cat] = files.length;
              totalCommands += files.length;
            }
          }
        }
      }

      let menuText = `╭── *「 ${botName.toUpperCase()} 」* ──◆
`;
      menuText += `│ 👤 *User:* @${m.senderNumber}
`;
      menuText += `│ 👑 *Owner:* ${ownerName}
`;
      menuText += `│ ⏳ *Uptime:* ${uptimeStr}
`;
      menuText += `│ ⚡ *Prefix:* [ ${prefix} ]
`;
      menuText += `│ 📁 *Total Cmd:* ${totalCommands}
`;
      menuText += `╰─────────────────────◆

`;

      menuText += `🤖 *KATEGORI PERINTAH*
`;
      for (const [cat, count] of Object.entries(categories)) {
        const emojiMap = {
          general: '📂',
          downloader: '📥',
          maker: '🎨',
          ai: '🤖',
          group: '👥',
          owner: '👑',
          tools: '🛠️',
          game: '🎮',
          fun: '🎉',
          search: '🔍'
        };
        const em = emojiMap[cat] || '✨';
        menuText += `ଓ ${em} *${prefix}menu ${cat}* (${count})
`;
      }

      menuText += `
> Ketik *${prefix}help <kategori>* atau gunakan perintah sesuai kebutuhanmu.`;

      await sock.sendMessage(m.chat, {
        text: menuText,
        mentions: [m.senderNumber + '@s.whatsapp.net']
      }, { quoted: m });

    } catch (error) {
      console.error(error);
      await m.reply('❌ Terjadi kesalahan saat memuat menu.');
    }
  }
};