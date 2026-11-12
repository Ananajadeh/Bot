/**
 * Command: tekateki
 * Game Teka-Teki menggunakan API Neoxr
 * API: https://api.neoxr.eu/api/tekateki
 */

const axios = require('axios');
const { startGame } = require('../../lib/game');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'tekateki',
  aliases: ['riddle', 'tebaktebakan', 'gametekateki'],
  category: 'game',
  description: 'Mainkan game tebak-tebakan Teka-Teki lucu dan seru',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m }) => {
    await m.react('⏳');

    try {
      const response = await axios.get('https://api.neoxr.eu/api/tekateki', {
        params: { apikey: config.neoxrApiKey },
        timeout: 30000
      });

      const res = response.data;
      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res?.msg || 'Gagal memuat soal Teka-Teki dari server.'}`);
      }

      const { pertanyaan, jawaban } = res.data;

      const session = await startGame(sock, m.chat, {
        type: 'tekateki',
        title: 'Teka-Teki',
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
            `🧩 *GAME TEKA-TEKI* 🧩\n\n` +
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

      const current = require('../../lib/game').getGame(m.chat);
      if (current) current.msgId = msg?.key?.id;

      await m.react('🧩');
    } catch (err) {
      error(`Error tekateki: ${err.message}`);
      await m.react('❌');
      await m.reply(`❌ Gagal mengambil soal Teka-Teki: ${err.message}`);
    }
  }
};
