/**
 * Database Manager - JSON File Based
 * Mendukung Multi-User Limit, Premium, Sewa Bot, Reset Limit 05:00 WIB
 */

const fs = require('fs');
const path = require('path');
const { info, warn } = require('./color');

const DB_PATH = path.resolve(__dirname, '../data/database.json');
const TEMP_PATH = path.resolve(__dirname, '../data/database.tmp.json');

// Menghitung siklus reset harian berdasarkan pukul 05:00 WIB (UTC+7)
function getCurrentResetCycle() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wib = new Date(utc + (7 * 3600000));

  const adjusted = new Date(wib.getTime());
  // Jika jam belum mencapai 05:00 WIB, masih masuk siklus hari kemarin
  if (wib.getHours() < 5) {
    adjusted.setDate(adjusted.getDate() - 1);
  }

  const y = adjusted.getFullYear();
  const m = String(adjusted.getMonth() + 1).padStart(2, '0');
  const d = String(adjusted.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Format durasi milidetik ke hari, jam, menit
function formatDuration(ms) {
  if (!ms || ms <= 0) return '0 menit';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days} hari`);
  if (hours > 0) parts.push(`${hours} jam`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} menit`);
  return parts.join(' ');
}

// Format tanggal ke waktu WIB
function formatDateWIB(timestamp) {
  if (!timestamp) return '-';
  const d = new Date(timestamp);
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short'
  }) + ' WIB';
}

class Database {
  constructor() {
    this.data = {
      users: {},
      groups: {},
      settings: {
        botOnlyGroup: false,
        privateOnlyPremium: true,
        lastResetCycle: getCurrentResetCycle(),
        limitPremium: 50,
        limitFree: 5
      }
    };
    this.isSaving = false;
    this.init();
  }

  init() {
    try {
      const dataDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || {},
          groups: parsed.groups || {},
          settings: {
            ...this.data.settings,
            ...(parsed.settings || {})
          }
        };
      } else {
        this.save();
      }

      if (!this.data.settings.customMenus) this.data.settings.customMenus = {};
      if (!this.data.settings.activeMenu) this.data.settings.activeMenu = 'default';

      // Jalankan cek reset limit saat inisialisasi
      this.checkResetLimit();
    } catch (err) {
      warn(`Gagal memuat database: ${err.message}. Menggunakan database baru.`);
      this.save();
    }
  }

  save() {
    try {
      const serialized = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(TEMP_PATH, serialized, 'utf8');
      fs.renameSync(TEMP_PATH, DB_PATH);
    } catch (err) {
      warn(`Gagal menyimpan database: ${err.message}`);
    }
  }

  /**
   * Cek dan reset limit semua user jika sudah melewati pukul 05:00 WIB
   */
  checkResetLimit() {
    const currentCycle = getCurrentResetCycle();
    if (this.data.settings.lastResetCycle !== currentCycle) {
      info(`[RESET LIMIT] Siklus baru terdeteksi (${currentCycle}). Mereset limit seluruh pengguna ke nilai harian...`);
      let resetCount = 0;

      for (const [id, user] of Object.entries(this.data.users)) {
        // Cek kedaluwarsa premium terlebih dahulu
        if (user.premium && user.premiumExpires && Date.now() > user.premiumExpires) {
          user.premium = false;
          user.premiumExpires = null;
        }

        user.limit = user.premium ? this.data.settings.limitPremium : this.data.settings.limitFree;
        user.lastResetCycle = currentCycle;
        resetCount++;
      }

      this.data.settings.lastResetCycle = currentCycle;
      this.save();
      info(`[RESET LIMIT] Selesai mereset ${resetCount} pengguna pada pukul 05:00 WIB.`);
      return true;
    }
    return false;
  }

  /**
   * Mengambil data user (otomatis inisialisasi & sinkronisasi limit harian)
   */
  getUser(phoneNumber, pushName = 'User') {
    const num = String(phoneNumber).replace(/[^0-9]/g, '');
    const currentCycle = getCurrentResetCycle();

    if (!this.data.users[num]) {
      this.data.users[num] = {
        name: pushName,
        premium: false,
        premiumExpires: null,
        limit: this.data.settings.limitFree,
        lastResetCycle: currentCycle,
        totalCommands: 0,
        createdAt: Date.now()
      };
      this.save();
    }

    const user = this.data.users[num];
    if (pushName && pushName !== 'User' && user.name !== pushName) {
      user.name = pushName;
    }

    // Cek kedaluwarsa premium
    if (user.premium && user.premiumExpires && Date.now() > user.premiumExpires) {
      user.premium = false;
      user.premiumExpires = null;
      if (user.limit > this.data.settings.limitFree) {
        user.limit = this.data.settings.limitFree;
      }
      this.save();
    }

    // Cek apakah limit user perlu di-reset untuk siklus hari ini
    if (user.lastResetCycle !== currentCycle) {
      user.limit = user.premium ? this.data.settings.limitPremium : this.data.settings.limitFree;
      user.lastResetCycle = currentCycle;
      this.save();
    }

    return user;
  }

  /**
   * Mengambil data grup (otomatis inisialisasi & sinkronisasi sewa)
   */
  getGroup(groupJid, groupName = 'Grup') {
    if (!this.data.groups[groupJid]) {
      this.data.groups[groupJid] = {
        name: groupName,
        rented: false,
        rentExpires: null,
        rentDays: 0,
        rentAddedAt: null,
        warns: {},
        botOnly: false,
        antitoxic: false,
        antivirtex: false,
        antitagall: false,
        antistickerspam: false,
        welcome: false,
        goodbye: false,
        createdAt: Date.now()
      };
      this.save();
    }

    const group = this.data.groups[groupJid];
    if (groupName && groupName !== 'Grup' && group.name !== groupName) {
      group.name = groupName;
    }

    // Status kedaluwarsa sewa grup ditangani oleh checkExpiredRent agar bot dapat mengirim pesan pamit & auto-leave
    if (!group.warns) group.warns = {};
    if (typeof group.antitoxic === 'undefined') group.antitoxic = false;
    if (typeof group.antivirtex === 'undefined') group.antivirtex = false;
    if (typeof group.antitagall === 'undefined') group.antitagall = false;
    if (typeof group.antistickerspam === 'undefined') group.antistickerspam = false;
    if (typeof group.welcome === 'undefined') group.welcome = false;
    if (typeof group.goodbye === 'undefined') group.goodbye = false;

    return group;
  }

  /**
   * Set Status Sewa Grup
   */
  addSewa(groupJid, days, groupName = 'Grup') {
    const group = this.getGroup(groupJid, groupName);
    const msToAdd = days * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Jika sudah sewa dan masih aktif, tambahkan masa sewa
    if (group.rented && group.rentExpires && group.rentExpires > now) {
      group.rentExpires += msToAdd;
      group.rentDays = (group.rentDays || 0) + days;
    } else {
      group.rented = true;
      group.rentExpires = now + msToAdd;
      group.rentDays = days;
      group.rentAddedAt = now;
    }

    this.save();
    return group;
  }

  /**
   * Hapus Sewa Grup
   */
  delSewa(groupJid) {
    if (this.data.groups[groupJid]) {
      this.data.groups[groupJid].rented = false;
      this.data.groups[groupJid].rentExpires = null;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Set Status Member Premium
   */
  addPremium(phoneNumber, days, pushName = 'User') {
    const user = this.getUser(phoneNumber, pushName);
    const msToAdd = days * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (user.premium && user.premiumExpires && user.premiumExpires > now) {
      user.premiumExpires += msToAdd;
    } else {
      user.premium = true;
      user.premiumExpires = now + msToAdd;
    }

    // Berikan limit premium (50)
    user.limit = Math.max(user.limit || 0, this.data.settings.limitPremium);
    this.save();
    return user;
  }

  /**
   * Hapus Member Premium
   */
  delPremium(phoneNumber) {
    const num = String(phoneNumber).replace(/[^0-9]/g, '');
    if (this.data.users[num]) {
      this.data.users[num].premium = false;
      this.data.users[num].premiumExpires = null;
      if (this.data.users[num].limit > this.data.settings.limitFree) {
        this.data.users[num].limit = this.data.settings.limitFree;
      }
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Mengambil daftar semua grup yang sedang menyewa bot
   */
  getAllRentedGroups() {
    const list = [];
    const now = Date.now();
    for (const [jid, g] of Object.entries(this.data.groups)) {
      if (g.rented && g.rentExpires && g.rentExpires > now) {
        list.push({
          jid,
          name: g.name,
          expires: g.rentExpires,
          remaining: g.rentExpires - now,
          days: g.rentDays
        });
      }
    }
    return list;
  }

  /**
   * Mengambil daftar semua member premium
   */
  getAllPremiumUsers() {
    const list = [];
    const now = Date.now();
    for (const [num, u] of Object.entries(this.data.users)) {
      if (u.premium && (!u.premiumExpires || u.premiumExpires > now)) {
        list.push({
          number: num,
          name: u.name,
          expires: u.premiumExpires,
          remaining: u.premiumExpires ? u.premiumExpires - now : null,
          limit: u.limit
        });
      }
    }
    return list;
  }

  /**
   * Cek grup sewa yang kedaluwarsa, kirim pesan pamit, dan otomatis keluar dari grup
   */
  async checkExpiredRent(sock) {
    const now = Date.now();
    for (const [jid, g] of Object.entries(this.data.groups)) {
      if (g.rented && g.rentExpires && g.rentExpires <= now) {
        g.rented = false;
        g.rentExpires = null;
        this.save();

        if (sock) {
          try {
            if (sock.sendMessage) {
              await sock.sendMessage(jid, {
                text:
                  `⏳ *MASA SEWA BOT TELAH BERAKHIR!*\n\n` +
                  `Halo member *${g.name || 'Grup'}*! Masa aktif sewa bot *${require('../config').botName}* di grup ini telah selesai.\n\n` +
                  `Sesuai ketentuan, bot akan *otomatis keluar* dari grup ini sekarang.\n` +
                  `Terima kasih banyak telah menggunakan bot kami! 🙏\n\n` +
                  `Jika ingin memperpanjang masa sewa atau mengundang bot kembali, silakan hubungi Owner:\n` +
                  `Ketik / hubungi: *${require('../config').prefix}owner*`
              });
            }

            // Jeda 2.5 detik agar pesan pamit sukses terkirim ke anggota grup
            await new Promise((resolve) => setTimeout(resolve, 2500));

            if (typeof sock.groupLeave === 'function') {
              await sock.groupLeave(jid);
            }
          } catch (leaveErr) {
            warn(`Gagal keluar otomatis dari grup ${jid}: ${leaveErr.message}`);
          }
        }
      }
    }
  }

  /**
   * Set custom menu tampilan (1, 2, 3, dst.)
   */
  setCustomMenu(id, text, hasImage = false) {
    if (!this.data.settings.customMenus) {
      this.data.settings.customMenus = {};
    }
    const strId = String(id).toLowerCase();
    this.data.settings.customMenus[strId] = {
      text,
      hasImage: Boolean(hasImage),
      updatedAt: Date.now()
    };
    this.save();
    return this.data.settings.customMenus[strId];
  }

  /**
   * Mengambil custom menu berdasarkan ID (1, 2, 3, dst.)
   */
  getCustomMenu(id) {
    if (!this.data.settings.customMenus) {
      this.data.settings.customMenus = {};
    }
    const strId = String(id).toLowerCase();
    return this.data.settings.customMenus[strId] || null;
  }

  /**
   * Menghapus custom menu berdasarkan ID
   */
  delCustomMenu(id) {
    if (!this.data.settings.customMenus) return false;
    const strId = String(id).toLowerCase();
    if (this.data.settings.customMenus[strId]) {
      delete this.data.settings.customMenus[strId];
      if (this.data.settings.activeMenu === strId) {
        this.data.settings.activeMenu = 'default';
      }
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Mengambil seluruh custom menu yang tersimpan
   */
  getAllCustomMenus() {
    if (!this.data.settings.customMenus) {
      this.data.settings.customMenus = {};
    }
    return this.data.settings.customMenus;
  }

  /**
   * Mengatur tampilan menu aktif untuk perintah .menu
   * @param {string} id - 'default', '1', '2', '3', dst.
   */
  setActiveMenu(id) {
    this.data.settings.activeMenu = String(id || 'default').toLowerCase();
    this.save();
    return this.data.settings.activeMenu;
  }

  /**
   * Dapatkan ID menu aktif saat ini
   */
  getActiveMenu() {
    return this.data.settings.activeMenu || 'default';
  }

}

const db = new Database();

module.exports = {
  db,
  getCurrentResetCycle,
  formatDuration,
  formatDateWIB
};
