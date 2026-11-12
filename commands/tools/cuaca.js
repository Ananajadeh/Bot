/**
 * Command: cuaca
 * Mengecek prakiraan dan kondisi cuaca terkini di seluruh kota/wilayah (Global & Indonesia)
 */

const axios = require('axios');

module.exports = {
  name: 'cuaca',
  aliases: ['weather', 'infocuaca'],
  category: 'tools',
  description: 'Mengecek prakiraan cuaca terkini suatu wilayah atau kota',
  usage: '<nama_kota/wilayah>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m, text, command }) => {
    const city = (text || '').trim();

    if (!city) {
      return m.reply(
        `🌤️ *INFORMASI CUACA LENGKAP* 🌤️\n\n` +
        `Silakan masukkan nama kota atau wilayah yang ingin dicek.\n\n` +
        `*Contoh:* \`.cuaca Jakarta\`\n` +
        `*Contoh:* \`.cuaca Bandung\`\n` +
        `*Contoh:* \`.cuaca Surabaya\``
      );
    }

    await m.react('⏳');

    try {
      const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        timeout: 15000
      });

      if (!res.data || !res.data.current_condition || !res.data.current_condition.length) {
        await m.react('❌');
        return m.reply(`❌ Data cuaca untuk wilayah *"${city}"* tidak ditemukan.`);
      }

      const cur = res.data.current_condition[0];
      const area = res.data.nearest_area?.[0];
      const areaName = area?.areaName?.[0]?.value || city;
      const country = area?.country?.[0]?.value || 'Indonesia';
      const region = area?.region?.[0]?.value || '';

      const temp = cur.temp_C;
      const feelsLike = cur.FeelsLikeC;
      const desc = cur.weatherDesc?.[0]?.value || cur.weatherDesc?.[0] || 'Cerah';
      const humidity = cur.humidity;
      const windSpeed = cur.windspeedKmph;
      const uv = cur.uvIndex;
      const pressure = cur.pressure;

      const output =
        `🌤️ *INFORMASI CUACA TERKINI* 🌤️\n\n` +
        `📍 *Wilayah:* ${areaName}, ${region ? region + ', ' : ''}${country}\n` +
        `🌡️ *Suhu:* ${temp}°C (Terasa: ${feelsLike}°C)\n` +
        `☁️ *Kondisi:* ${desc}\n` +
        `💧 *Kelembapan:* ${humidity}%\n` +
        `🌬️ *Kecepatan Angin:* ${windSpeed} km/jam\n` +
        `☀️ *Indeks UV:* ${uv}\n` +
        `📊 *Tekanan Udara:* ${pressure} hPa\n\n` +
        `_Data cuaca akurat & diperbarui secara real-time._`;

      await m.react('✅');
      await m.reply(output);

    } catch (err) {
      await m.react('❌');
      await m.reply(`❌ Terjadi kesalahan saat mengambil informasi cuaca: ${err.message}`);
    }
  }
};
