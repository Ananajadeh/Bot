/**
 * Command: truth
 * Game Truth (Kejujuran) menggunakan API Neoxr
 * API: https://api.neoxr.eu/api/truth
 */

const axios = require('axios');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'truth',
  aliases: ['kejujuran', 'gametruth'],
  category: 'game',
  description: 'Dapatkan pertanyaan kejujuran untuk game Truth or Dare',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m }) => {
    await m.react('⏳');

    try {
      const response = await axios.get('https://api.neoxr.eu/api/truth', {
        params: { apikey: config.neoxrApiKey },
        timeout: 30000
      });

      const res = response.data;
      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res?.msg || 'Gagal memuat pertanyaan Truth dari server.'}`);
      }

      const text = res.data.text || res.data;

      await m.reply(
        `🎭 *TRUTH (KEJUJURAN)* 🎭\n\n` +
        `"${text}"\n\n` +
        `_Jawab dengan jujur dan jangan berbohong!_`
      );

      await m.react('🎭');
    } catch (err) {
      error(`Error truth: ${err.message}`);
      await m.react('❌');
      await m.reply(`❌ Gagal mengambil data Truth: ${err.message}`);
    }
  }
};
