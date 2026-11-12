/**
 * Command: siapaaku / whoami
 * Game Siapa Aku menggunakan API Neoxr
 * API: https://api.neoxr.eu/api/whoami
 */

const axios = require('axios');
const { startGame, getGame } = require('../../lib/game');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'siapaaku',
  aliases: ['whoami', 'tebaksiapaaku', 'gamesiapaaku'],
  category: 'game',
  description: 'Mainkan game tebak teka-teki Siapa Aku',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m }) => {
    await m.react('⏳');

    try {
      const response = await axios.get('https://api.neoxr.eu/api/whoami', {
        params: { apikey: config.neoxrApiKey },
        timeout: 30000
      });

      const res = response.data;
      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res?.msg || 'Gagal memuat soal Siapa Aku dari server.'}`);
      }

      const { pertanyaan, jawaban } = res.data;

      const session = await startGame(sock, m.chat, {
        type: 'whoami',
        title: 'Siapa Aku',
        question: pertanyaan,
        answer: jawaban,
        timeLimit: 90,
        rewardLimit: 1
      });

      if (!session.success) {
        await m.react('⚠️');
        return m.reply(session.message);
      }

      const msg = await sock.sendMessage(
        m.chat,
        {
          text:
            `👤 *GAME SIAPA AKU* 👤\n\n` +
            `*Pertanyaan:*\n` +
            `"${pertanyaan}"\n\n` +
            `⏱️ *Waktu:* 90 detik\n` +
            `🎁 *Hadiah:* +1 Limit\n` +
            `💡 *Bantuan:* Ketik \`${config.prefix}hint\`\n` +
            `🏳️ *Menyerah:* Ketik \`${config.prefix}nyerah\`\n\n` +
            `👉 *Ketik langsung jawabanmu di obrolan ini!*`
        },
        { quoted: m }
      );

      const current = getGame(m.chat);
      if (current) current.msgId = msg.key?.id;

      await m.react('🧩');
    } catch (err) {
      error(`[SIAPA AKU ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat memulai game Siapa Aku: ${err.message}`);
    }
  }
};
