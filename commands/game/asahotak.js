/**
 * Command: asahotak
 * Game Asah Otak menggunakan API Neoxr
 * API: https://api.neoxr.eu/api/asahotak
 */

const axios = require('axios');
const { startGame } = require('../../lib/game');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'asahotak',
  aliases: ['gameasahotak', 'asahotakgame'],
  category: 'game',
  description: 'Mainkan game kuis Asah Otak',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m }) => {
    await m.react('⏳');

    try {
      const response = await axios.get('https://api.neoxr.eu/api/asahotak', {
        params: { apikey: config.neoxrApiKey },
        timeout: 30000
      });

      const res = response.data;
      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res?.msg || 'Gagal memuat soal Asah Otak dari server.'}`);
      }

      const { pertanyaan, jawaban } = res.data;

      const session = await startGame(sock, m.chat, {
        type: 'asahotak',
        title: 'Asah Otak',
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
            `🧠 *GAME ASAH OTAK* 🧠\n\n` +
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

      // Simpan msgId agar jika user me-reply pesan ini dengan jawaban yang salah bisa dideteksi
      const current = require('../../lib/game').getGame(m.chat);
      if (current) current.msgId = msg.key?.id;

      await m.react('🧩');
    } catch (err) {
      error(`[ASAH OTAK ERROR] ${err.stack || err.message}`);
      await m.react('❌');
      return m.reply(`❌ Terjadi kesalahan saat memulai game Asah Otak: ${err.message}`);
    }
  }
};
