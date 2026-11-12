/**
 * Command: tod / truthordare
 * Game Truth or Dare interaktif menggunakan API Neoxr
 */

const axios = require('axios');
const config = require('../../config');
const { error } = require('../../lib/color');

module.exports = {
  name: 'tod',
  aliases: ['truthordare', 'tord'],
  category: 'game',
  description: 'Mainkan game Truth or Dare (Kejujuran atau Tantangan)',
  usage: '[truth / dare]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m, args }) => {
    await m.react('⏳');

    let choice = (args[0] || '').toLowerCase();
    if (choice !== 'truth' && choice !== 'dare') {
      choice = Math.random() > 0.5 ? 'truth' : 'dare';
    }

    try {
      const response = await axios.get(`https://api.neoxr.eu/api/${choice}`, {
        params: { apikey: config.neoxrApiKey },
        timeout: 30000
      });

      const res = response.data;
      if (!res || !res.status || !res.data) {
        await m.react('❌');
        return m.reply(`❌ Gagal mengambil data ${choice} dari server.`);
      }

      const text = res.data.text || res.data;

      if (choice === 'truth') {
        await m.reply(
          `🎭 *TRUTH OR DARE ➔ TRUTH* 🎭\n\n` +
          `"${text}"\n\n` +
          `_Katakan yang sejujurnya, jangan berbohong!_`
        );
        await m.react('🎭');
      } else {
        await m.reply(
          `🔥 *TRUTH OR DARE ➔ DARE* 🔥\n\n` +
          `"${text}"\n\n` +
          `_Lakukan tantangan ini tanpa ragu!_`
        );
        await m.react('🔥');
      }
    } catch (err) {
      error(`Error tod: ${err.message}`);
      await m.react('❌');
      await m.reply(`❌ Gagal mengambil soal Truth or Dare: ${err.message}`);
    }
  }
};
