/**
 * Command: kuis / quiz / family100
 * Game Kuis Survey Family 100 menggunakan API Neoxr
 * API: https://api.neoxr.eu/api/quiz
 */

const axios = require('axios');
const { startGame, getGame } = require('../../lib/game');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'kuis',
  aliases: ['quiz', 'family100', 'fam100', 'gamekuis'],
  category: 'game',
  description: 'Mainkan game kuis survey (Family 100)',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m }) => {
    await m.react('⏳');

    try {
      const response = await axios.get('https://api.neoxr.eu/api/quiz', {
        params: { apikey: config.neoxrApiKey },
        timeout: 30000
      });

      const res = response.data;
      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res?.msg || 'Gagal memuat soal Kuis dari server.'}`);
      }

      const { pertanyaan, jawaban } = res.data;

      const session = await startGame(sock, m.chat, {
        type: 'quiz',
        title: 'Kuis Survey',
        question: pertanyaan,
        answer: Array.isArray(jawaban) ? jawaban : [jawaban],
        timeLimit: 120,
        rewardLimit: 1
      });

      if (!session.success) {
        await m.react('⚠️');
        return m.reply(session.message);
      }

      const count = Array.isArray(jawaban) ? jawaban.length : 1;

      const msg = await sock.sendMessage(
        m.chat,
        {
          text:
            `📊 *GAME KUIS SURVEY (FAMILY 100)* 📊\n\n` +
            `*Pertanyaan:*\n` +
            `"${pertanyaan}"\n\n` +
            `🎯 *Terdapat:* ${count} kemungkinan jawaban survey\n` +
            `⏱️ *Waktu:* 120 detik\n` +
            `🎁 *Hadiah:* +1 Limit\n` +
            `💡 *Bantuan:* Ketik \`${config.prefix}hint\`\n` +
            `🏳️ *Menyerah:* Ketik \`${config.prefix}nyerah\`\n\n` +
            `👉 *Tebak salah satu jawaban survey di obrolan ini!*`
        },
        { quoted: m }
      );

      const current = getGame(m.chat);
      if (current) current.msgId = msg?.key?.id;

      await m.react('📊');
    } catch (err) {
      error(`Error kuis: ${err.message}`);
      await m.react('❌');
      await m.reply(`❌ Gagal mengambil soal Kuis: ${err.message}`);
    }
  }
};
