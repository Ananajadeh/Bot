/**
 * Command: runtime
 * Menampilkan durasi aktif bot sejak dinyalakan
 */

function formatRuntime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d} hari`);
  if (h > 0) parts.push(`${h} jam`);
  if (m > 0) parts.push(`${m} menit`);
  parts.push(`${s} detik`);
  return parts.join(' ');
}

module.exports = {
  name: 'runtime',
  aliases: ['uptime'],
  category: 'general',
  description: 'Mengecek berapa lama bot sudah aktif menyala',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async ({ m }) => {
    const runtime = formatRuntime(process.uptime());
    await m.reply(`⏱️ *nayxilaa md* telah aktif berjalan selama:\n*${runtime}*`);
  }
};
