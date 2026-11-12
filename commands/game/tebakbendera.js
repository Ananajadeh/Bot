/**
 * Command: tebakbendera / whatflag
 * Game Tebak Bendera Negara menggunakan API Neoxr
 * API: https://api.neoxr.eu/api/whatflag
 */

const axios = require('axios');
const { startGame, getGame } = require('../../lib/game');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'tebakbendera',
  aliases: ['whatflag', 'bendera', 'gametebakbendera'],
  category: 'game',
  description: 'Mainkan game tebak bendera negara-negara di dunia',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m }) => {
    await m.react('⏳');

    try {
      const response = await axios.get('https://api.neoxr.eu/api/whatflag', {
        params: { apikey: config.neoxrApiKey },
        timeout: 30000
      });

      const res = response.data;
      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res?.msg || 'Gagal memuat soal Tebak Bendera dari server.'}`);
      }

      const { img, name } = res.data;

      const session = await startGame(sock, m.chat, {
        type: 'whatflag',
        title: 'Tebak Bendera',
        question: 'Tebak nama negara dari bendera berikut',
        answer: name,
        timeLimit: 90,
        rewardLimit: 1
      });

      if (!session.success) {
        await m.react('⚠️');
        return m.reply(session.message);
      }

      // Unduh gambar bendera
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
            `🚩 *GAME TEBAK BENDERA* 🚩\n\n` +
            `Tebak nama negara dari bendera pada gambar di atas!\n\n` +
            `⏱️ *Waktu:* 90 detik\n` +
            `🎁 *Hadiah:* +1 Limit\n` +
            `💡 *Bantuan:* Ketik \`${config.prefix}hint\`\n` +
            `🏳️ *Menyerah:* Ketik \`${config.prefix}nyerah\`\n\n` +
            `👉 *Ketik langsung jawabanmu di obrolan ini!*`
        },
        { quoted: m }
      );

      const current = getGame(m.chat);
      if (current) current.msgId = msg?.key?.id;

      await m.react('🚩');
    } catch (err) {
      error(`Error tebakbendera: ${err.message}`);
      await m.react('❌');
      await m.reply(`❌ Gagal mengambil soal Tebak Bendera: ${err.message}`);
    }
  }
};
