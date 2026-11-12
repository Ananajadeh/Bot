/**
 * Command: broadcast
 * Mengirim pesan broadcast ke semua obrolan / grup
 */

module.exports = {
  name: 'broadcast',
  aliases: ['bc', 'bcall'],
  category: 'owner',
  description: 'Mengirim pesan siaran ke obrolan WhatsApp',
  usage: '<pesan broadcast>',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ sock, m, text }) => {
    const msg = text || (m.quoted ? m.quoted.text : null);

    if (!msg) {
      return m.reply('⚠️ Masukkan teks pesan broadcast yang ingin disebarkan!\nContoh: `.bc Informasi pemeliharaan sistem bot`');
    }

    await m.reply('⏳ Mengambil daftar kontak & grup untuk broadcast...');

    try {
      // Ambil daftar chat dari store atau socket
      const chats = await sock.groupFetchAllParticipating().catch(() => ({}));
      const groupIds = Object.keys(chats);

      if (groupIds.length === 0) {
        return m.reply('⚠️ Tidak ada grup aktif yang diikuti bot untuk dikirimkan broadcast.');
      }

      await m.reply(`📢 Memulai pengiriman siaran ke ${groupIds.length} grup...`);

      let sentCount = 0;
      for (const jid of groupIds) {
        try {
          await sock.sendMessage(jid, {
            text: `╭───「 *BROADCAST OWNER* 」───\n\n${msg}\n\n╰───「 *nayxilaa md* 」───`
          });
          sentCount++;
          // Delay agar tidak terkena spam rate limit WhatsApp
          await new Promise((r) => setTimeout(r, 1500));
        } catch {
          // Lanjutkan jika satu grup gagal
        }
      }

      await m.reply(`✅ *Broadcast Selesai!*\nBerhasil dikirim ke *${sentCount}* grup.`);
    } catch (err) {
      await m.reply(`❌ Gagal melakukan broadcast: ${err.message}`);
    }
  }
};
