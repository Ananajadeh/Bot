/**
 * Command: susunkata / whatword
 * Game Susun Kata menggunakan API Neoxr
 * API: https://api.neoxr.eu/api/whatword
 */

const axios = require('axios');
const { startGame, getGame } = require('../../lib/game');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'susunkata',
  aliases: ['whatword', 'gamesusunkata', 'susunhuruf', 'tebakkata'],
  category: 'game',
  description: 'Mainkan game tebak dan susun huruf acak menjadi kata yang benar',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m }) => {
    await m.react('⏳');

    try {
      const response = await axios.get('https://api.neoxr.eu/api/whatword', {
        params: { apikey: config.neoxrApiKey },
        timeout: 30000
      });

      const res = response.data;
      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res?.msg || 'Gagal memuat soal Susun Kata dari server.'}`);
      }

      const { pertanyaan, jawaban, tipe } = res.data;

      const session = await startGame(sock, m.chat, {
        type: 'whatword',
        title: 'Susun Kata',
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
            `🔤 *GAME SUSUN KATA* 🔤\n\n` +
            `◦ *Kategori  :* ${tipe || 'Umum'}\n` +
            `◦ *Huruf Acak:* *${pertanyaan}*\n\n` +
            `⏱️ *Waktu:* 90 detik\n` +
            `🎁 *Hadiah:* +1 Limit\n` +
            `💡 *Bantuan:* Ketik \`${config.prefix}hint\`\n` +
            `🏳️ *Menyerah:* Ketik \`${config.prefix}nyerah\`\n\n` +
            `👉 *Susunlah menjadi kata yang tepat dan kirim di chat!*`
        },
        { quoted: m }
      );

      const current = getGame(m.chat);
      if (current) current.msgId = msg.key?.id;

      await m.react('🧩');
    } catch (err) {
      error(`[SUSUN KATA ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat memulai game Susun Kata: ${err.message}`);
    }
  }
};
