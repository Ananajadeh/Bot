/**
 * Command: dare
 * Game Dare (Tantangan) menggunakan API Neoxr
 * API: https://api.neoxr.eu/api/dare
 */

const axios = require('axios');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'dare',
  aliases: ['tantangan', 'gamedare'],
  category: 'game',
  description: 'Dapatkan tantangan seru untuk game Truth or Dare',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m }) => {
    await m.react('⏳');

    try {
      const response = await axios.get('https://api.neoxr.eu/api/dare', {
        params: { apikey: config.neoxrApiKey },
        timeout: 30000
      });

      const res = response.data;
      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ ${res?.msg || 'Gagal memuat tantangan Dare dari server.'}`);
      }

      const text = res.data.text || res.data;

      await m.reply(
        `🔥 *DARE (TANTANGAN)* 🔥\n\n` +
        `"${text}"\n\n` +
        `_Lakukan tantangan ini dan jangan lari dari kenyataan!_`
      );

      await m.react('🔥');
    } catch (err) {
      error(`Error dare: ${err.message}`);
      await m.react('❌');
      await m.reply(`❌ Gagal mengambil data Dare: ${err.message}`);
    }
  }
};
