/**
 * Command: tebaklagu / whatsong
 * Game Tebak Judul Lagu menggunakan API Neoxr
 * API: https://api.neoxr.eu/api/whatsong
 */

const axios = require('axios');
const { startGame, getGame } = require('../../lib/game');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'tebaklagu',
  aliases: ['whatsong', 'gametebaklagu', 'tebakmusik'],
  category: 'game',
  description: 'Mainkan game tebak judul lagu dari potongan audio',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m }) => {
    await m.react('⏳');

    try {
      const response = await axios.get('https://api.neoxr.eu/api/whatsong', {
        params: { apikey: config.neoxrApiKey },
        timeout: 30000
      });

      const res = response.data;
      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res?.msg || 'Gagal memuat soal Tebak Lagu dari server.'}`);
      }

      const { title, path } = res.data;

      const session = await startGame(sock, m.chat, {
        type: 'whatsong',
        title: 'Tebak Lagu',
        question: 'Dengarkan potongan audio dan tebak judul lagunya',
        answer: title,
        timeLimit: 120,
        rewardLimit: 1
      });

      if (!session.success) {
        await m.react('⚠️');
        return m.reply(session.message);
      }

      // Kirim potongan audio lagu
      await sock.sendMessage(
        m.chat,
        {
          audio: { url: path },
          mimetype: 'audio/mp4',
          ptt: false
        },
        { quoted: m }
      );

      // Kirim pesan instruksi
      const msg = await sock.sendMessage(
        m.chat,
        {
          text:
            `🎵 *GAME TEBAK LAGU* 🎵\n\n` +
            `Dengarkan potongan musik audio di atas dan tebak judul lagunya!\n\n` +
            `⏱️ *Waktu:* 120 detik\n` +
            `🎁 *Hadiah:* +1 Limit\n` +
            `💡 *Bantuan:* Ketik \`${config.prefix}hint\`\n` +
            `🏳️ *Menyerah:* Ketik \`${config.prefix}nyerah\`\n\n` +
            `👉 *Ketik langsung jawabanmu di obrolan ini!*`
        },
        { quoted: m }
      );

      const current = getGame(m.chat);
      if (current) current.msgId = msg?.key?.id;

      await m.react('🎵');
    } catch (err) {
      error(`Error tebaklagu: ${err.message}`);
      await m.react('❌');
      await m.reply(`❌ Gagal mengambil soal Tebak Lagu: ${err.message}`);
    }
  }
};
