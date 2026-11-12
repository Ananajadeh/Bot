const axios = require('axios');
const config = require('../../config');

module.exports = {
  name: 'gempa',
  aliases: ['cekgempa', 'bmkggempa'],
  category: 'tools',
  description: 'Cek gempa BMKG terkini dari pusat gempa BMKG.',
  usage: '<optional: ringkas>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ sock, m, args, text, command, groupMetadata, isOwner, isAdmin, isBotAdmin, user }) => {
    try {
      await m.react('⏳');
      const url = 'https://bmkg.go.id/gempabumi/gempabumi.json';
      const res = await axios.get(url, { timeout: 10000 });
      const data = res.data || {};

      let gempaInfo = null;
      if (data.Infogempa) {
        gempaInfo = data.Infogempa;
      }

      let timeStr = '';
      let mag = '';
      let lokasi = '';
      let kedalaman = '';
      let coords = '';

      if (gempaInfo) {
        if (gempaInfo.Tanggal && gempaInfo.Jam) {
          timeStr = `${gempaInfo.Tanggal} ${gempaInfo.Jam} WIB`;
        } else if (gempaInfo.Tanggal) {
          timeStr = `${gempaInfo.Tanggal} WIB`;
        } else if (gempaInfo['Tanggal-Jam']) {
          timeStr = gempaInfo['Tanggal-Jam'];
        }

        mag = gempaInfo.Magnitude || gempaInfo.MagnitudeBMG || '';
        lokasi = gempaInfo.Wilayah || gempaInfo.Coordinates_all || gempaInfo.Coordinates || gempaInfo.Lintang;
        kedalaman = gempaInfo.Kedalaman || '';
        if (gempaInfo.Coordinates) coords = gempaInfo.Coordinates;
        if (!coords && gempaInfo.Lintang && gempaInfo.Bujur) coords = `${gempaInfo.Lintang}, ${gempaInfo.Bujur}`;
      }

      if (!timeStr && data.Gempa && Array.isArray(data.Gempa) && data.Gempa.length > 0) {
        const g = data.Gempa[0];
        timeStr = g.Tanggal ? g.Tanggal + ' ' + (g.Jam || '') : '';
        mag = g.Magnitude || g.MagnitudeGempa || '';
        lokasi = g.Wilayah || g.WilayahDampak || '';
        kedalaman = g.Kedalaman || '';
        coords = g.Coordinates || '';
      }

      if (!timeStr) {
        timeStr = 'Waktu gempa tidak tersedia';
      }

      const parts = [
        '📡 Gempa BMKG Terakhir',
        `Waktu: ${timeStr}`,
        `Lokasi: ${lokasi || 'Tidak diketahui'}`,
        `Magnitudo: ${mag || 'Tidak diketahui'}`,
        `Kedalaman: ${kedalaman || 'Tidak diketahui'} km`,
        coords ? `Koordinat: ${coords}` : ''
      ].filter(p => p && p.length > 0);

      const reply = parts.join('\n');

      await m.reply(reply);
      await m.react('✅');
    } catch (err) {
      await m.reply('⚠️ Gagal mengambil data gempa BMKG. Coba lagi nanti.');
      await m.react('❌');
      console.error('Gempa BMKG error:', err);
    }
  }
};
