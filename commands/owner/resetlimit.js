/**
 * Command: resetlimit
 * Memaksa reset seluruh limit harian pengguna secara instan
 */

const { db } = require('../../lib/database');

module.exports = {
  name: 'resetlimit',
  aliases: ['forceresetlimit'],
  category: 'owner',
  description: 'Memaksa reset limit semua pengguna secara instan',
  usage: '',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: true,

  execute: async ({ m }) => {
    let count = 0;
    const nowCycle = require('../../lib/database').getCurrentResetCycle();

    for (const [id, user] of Object.entries(db.data.users)) {
      if (user.premium && user.premiumExpires && Date.now() > user.premiumExpires) {
        user.premium = false;
        user.premiumExpires = null;
      }

      user.limit = user.premium ? db.data.settings.limitPremium : db.data.settings.limitFree;
      user.lastResetCycle = nowCycle;
      count++;
    }

    db.data.settings.lastResetCycle = nowCycle;
    db.save();

    return m.reply(
      `✅ *RESET LIMIT BERHASIL!*\n\n` +
      `Seluruh limit pengguna (${count} user) telah di-reset:\n` +
      `• Member Premium: *50 Limit*\n` +
      `• Member Reguler: *5 Limit*`
    );
  }
};
