/**
 * Command: tebakgambar / whatimg
 * Game Tebak Gambar menggunakan API Neoxr
 * API: https://api.neoxr.eu/api/whatimg
 */

const axios = require('axios');
const { startGame, getGame } = require('../../lib/game');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'tebakgambar',
  aliases: ['whatimg', 'gametebakgambar', 'tebakfoto'],
  category: 'game',
  description: 'Mainkan game tebak makna dari teka-teki gambar',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m }) => {
    await m.react('⏳');

    try {
      const response = await axios.get('https://api.neoxr.eu/api/whatimg', {
        params: { apikey: config.neoxrApiKey },
        timeout: 30000
      });

      const res = response.data;
      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res?.msg || 'Gagal memuat soal Tebak Gambar dari server.'}`);
      }

      const { img, jawaban, deskripsi } = res.data;

      const session = await startGame(sock, m.chat, {
        type: 'whatimg',
        title: 'Tebak Gambar',
        question: deskripsi || 'Gambar tebak-tebakan',
        answer: jawaban,
        timeLimit: 120,
        rewardLimit: 1
      });

      if (!session.success) {
        await m.react('⚠️');
        return m.reply(session.message);
      }

      // Unduh gambar soal tebak gambar
      const imgRes = await axios.get(img, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      const imgBuffer = Buffer.from(imgRes.data);

      const msg = await sock.sendMessage(
        m.chat,
        {
          image: imgBuffer,
          caption:
            `🖼️ *GAME TEBAK GAMBAR* 🖼️\n\n` +
            `*Petunjuk:*\n` +
            `_${deskripsi || '-' }_\n\n` +
            `⏱️ *Waktu:* 120 detik\n` +
            `🎁 *Hadiah:* +1 Limit\n` +
            `💡 *Bantuan:* Ketik \`${config.prefix}hint\`\n` +
            `🏳️ *Menyerah:* Ketik \`${config.prefix}nyerah\`\n\n` +
            `👉 *Tebaklah arti gambar ini dan ketik jawabanmu di chat!*`
        },
        { quoted: m }
      );

      const current = getGame(m.chat);
      if (current) current.msgId = msg.key?.id;

      await m.react('🧩');
    } catch (err) {
      error(`[TEBAK GAMBAR ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat memulai game Tebak Gambar: ${err.message}`);
    }
  }
};
