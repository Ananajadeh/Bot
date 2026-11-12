/**
 * Main Message Handler & Command Dispatcher
 * nayxilaa md - WhatsApp Bot
 */

const config = require('./config');
const { serialize, normalizeNumber } = require('./lib/serialize');
const { getCommand } = require('./lib/loader');
const { handleCommandTypo } = require('./lib/commandCorrector');
const { logMsg, error } = require('./lib/color');
const { db } = require('./lib/database');
const { handlePlatformError } = require('./lib/errorHandler');

// Daftar command yang tidak memotong limit (Bebas / Gratis)
const FREE_COMMANDS = new Set([
  'menu', 'help', 'bantuan',
  'menu1', 'menu2', 'menu3', 'menu4', 'menu5',
  'tampilan1', 'tampilan2', 'tampilan3',
  'owner', 'creator',
  'ping', 'speed',
  'runtime', 'uptime',
  'limit', 'ceklimit', 'me', 'profile', 'status', 'cekprem',
  'ceksewa', 'listsewa', 'daftarsewa', 'sewainfo',
  'listprem', 'daftarprem',
  'nyerah', 'surrender', 'hint'
]);

// Cache metadata grup untuk mempercepat respon & menghindari rate limit
const groupCache = new Map();

async function getGroupMetadata(sock, jid) {
  const cached = groupCache.get(jid);
  if (cached && Date.now() - cached.timestamp < 30000) {
    return cached.data;
  }
  try {
    const data = await sock.groupMetadata(jid);
    groupCache.set(jid, { data, timestamp: Date.now() });
    return data;
  } catch {
    return cached ? cached.data : null;
  }
}

module.exports = async function messageHandler(sock, rawMsg) {
  let m = null;
  let command = '';
  try {
    m = serialize(sock, rawMsg);
    if (!m || !m.message) return;

    // Abaikan pesan status WhatsApp (status@broadcast)
    if (m.chat === 'status@broadcast') return;

    // Abaikan pesan protokol baileys
    if (m.isBaileys) return;

    // Resolusi status grup & proteksi grup (Anti-toxic, Anti-virtex, Anti-tagall, Anti-sticker spam)
    let groupMetadata = null;
    let isAdmin = false;
    let isBotAdmin = false;

    if (m.isGroup) {
      groupMetadata = await getGroupMetadata(sock, m.chat);

      if (groupMetadata) {
        const participants = groupMetadata.participants || [];
        const botPn = sock.user?.id ? normalizeNumber(sock.user.id) : '';
        const botLid = sock.user?.lid ? normalizeNumber(sock.user.lid) : '';

        // Cek status admin pengirim
        const senderMember = participants.find((p) => {
          const pNum = normalizeNumber(p.id);
          return (
            p.id === m.sender ||
            pNum === m.senderNumber ||
            (m.senderLid && (pNum === m.senderLid || p.id.includes(m.senderLid)))
          );
        });
        isAdmin = senderMember ? (senderMember.admin === 'admin' || senderMember.admin === 'superadmin') : false;

        // Cek status admin bot
        const botMember = participants.find((p) => {
          const pNum = normalizeNumber(p.id);
          return (
            pNum === botPn ||
            (botLid && pNum === botLid) ||
            (botPn && p.id.includes(botPn)) ||
            (botLid && p.id.includes(botLid))
          );
        });
        isBotAdmin = botMember ? (botMember.admin === 'admin' || botMember.admin === 'superadmin') : false;
      }

      // Jalankan pengecekan fitur proteksi keamanan grup
      const { checkGroupProtection } = require('./lib/groupProtector');
      const isBlocked = await checkGroupProtection(sock, m, { groupMetadata, isAdmin, isBotAdmin });
      if (isBlocked) return;
    }

    const body = (m.body || '').trim();
    if (!body) return;

    // Cek apakah pesan merupakan jawaban pada sesi game aktif di chat ini
    const { checkGameAnswer } = require('./lib/game');
    const isGameHandled = await checkGameAnswer(sock, m, body);
    if (isGameHandled) return;

    // Cek apakah pesan menggunakan prefix atau perintah tanpa prefix khusus owner (> , => , $)
    const prefixes = Array.isArray(config.prefix) ? config.prefix : [config.prefix];
    let usedPrefix = null;

    for (const p of prefixes) {
      if (body.startsWith(p)) {
        usedPrefix = p;
        break;
      }
    }

    let isEvalOrExec = false;
    let command = '';
    let args = [];
    let text = '';

    if (usedPrefix) {
      const withoutPrefix = body.slice(usedPrefix.length).trim();
      const parts = withoutPrefix.split(/\s+/);
      command = parts[0].toLowerCase();
      args = parts.slice(1);
      text = withoutPrefix.slice(command.length).trim();
    } else if (m.isOwner && (body.startsWith('>') || body.startsWith('=>') || body.startsWith('$'))) {
      // Shortcut langsung untuk owner
      isEvalOrExec = true;
      if (body.startsWith('=>')) {
        command = 'eval';
        text = '=> ' + body.slice(2).trim();
      } else if (body.startsWith('>')) {
        command = 'eval';
        text = body.slice(1).trim();
      } else if (body.startsWith('$')) {
        command = 'exec';
        text = body.slice(1).trim();
      }
      args = text.split(/\s+/);
    } else {
      // Pesan biasa, bukan perintah
      return;
    }

    if (!command) return;

    // Mode Self Check: Jika mode self dan pengirim BUKAN owner, abaikan perintah
    if (config.mode === 'self' && !m.isOwner) {
      return;
    }

    // Sinkronisasi reset limit harian pukul 05:00 WIB & cek kedaluwarsa sewa
    db.checkResetLimit();
    db.checkExpiredRent(sock);

    // Ambil atau inisialisasi data pengguna di database
    const user = db.getUser(m.senderNumber, m.pushName);

    // Filter Khusus Private Chat:
    // Hanya Member Premium & Owner yang dapat menggunakan bot di Private Chat
    if (!m.isGroup && !m.isOwner) {
      // Cek apakah mode Bot Only Group diaktifkan
      if (db.data.settings.botOnlyGroup) {
        return m.reply(
          `⚠️ *Akses Ditolak!*\n\n` +
          `Mode *Bot Only Group* sedang aktif. Bot ini saat ini hanya dapat digunakan di dalam *Grup WhatsApp*.\n\n` +
          `Silakan masukkan bot ke grup Anda atau hubungi Owner: *${usedPrefix || config.prefix}owner*`
        );
      }

      // Cek apakah pengirim adalah Member Premium
      if (db.data.settings.privateOnlyPremium && !user.premium) {
        return m.reply(
          `⚠️ *AKSES PRIVATE CHAT DIBATASI!*\n\n` +
          `Halo kak @${m.senderNumber}, mohon maaf bot ini hanya dapat digunakan di *Private Chat* oleh *Member Premium* & *Owner*.\n\n` +
          `✨ *Solusi & Cara Penggunaan:*\n` +
          `1. Gunakan bot secara gratis di dalam *Grup WhatsApp* (Tersedia 5 limit/hari).\n` +
          `2. Upgrade akun Anda ke *Member Premium*:\n` +
          `   • Bebas akses bot di Private Chat\n` +
          `   • Mendapatkan *50 Limit Harian*\n\n` +
          `Untuk sewa bot atau upgrade Premium, silakan hubungi Owner:\n` +
          `Ketik: *${usedPrefix || config.prefix}owner*`,
          { mentions: [m.sender] }
        );
      }
    }

    // Ambil modul command dari loader
    const cmd = getCommand(command);
    if (!cmd) {
      // Fitur Koreksi Perintah (Typo Auto-Suggestion)
      await handleCommandTypo(sock, m, command, usedPrefix, {
        isOwner: m.isOwner,
        isGroup: m.isGroup
      });
      return;
    }

    // Log pesan ke terminal
    logMsg(
      m.isGroup ? 'GROUP' : 'PRIVATE',
      `@${m.senderNumber} (${m.pushName})`,
      `${usedPrefix || ''}${command}`
    );

    // Filter khusus fitur Owner
    if (cmd.ownerOnly && !m.isOwner) {
      return m.reply(config.messages.ownerOnly);
    }

    // Filter khusus grup
    if (cmd.groupOnly && !m.isGroup) {
      return m.reply(config.messages.groupOnly);
    }

    if (m.isGroup) {
      // Filter khusus Admin Grup (Owner bot selalu diizinkan)
      if (cmd.adminOnly && !isAdmin && !m.isOwner) {
        return m.reply(config.messages.adminOnly);
      }

      // Filter apakah bot harus menjadi admin terlebih dahulu
      if (cmd.botAdminOnly && !isBotAdmin) {
        return m.reply(config.messages.botAdmin);
      }
    }

    // Pengecekan Limit Harian:
    // Owner bebas tanpa batas limit.
    // Perintah dalam daftar FREE_COMMANDS tidak mengurangi limit.
    if (!m.isOwner && !cmd.ownerOnly && !FREE_COMMANDS.has(command)) {
      if (user.limit <= 0) {
        const limitMax = user.premium ? db.data.settings.limitPremium : db.data.settings.limitFree;
        return m.reply(
          `⚠️ *LIMIT HARIAN ANDA SUDAH HABIS!*\n\n` +
          `Sisa limit Anda hari ini: *0 / ${limitMax} Limit*.\n` +
          `Limit akan otomatis di-reset setiap hari pada pukul *05:00 WIB*.\n\n` +
          `👑 *Keuntungan Menjadi Member Premium:*\n` +
          `• Limit harian *50 Limit* (Reguler hanya 5 limit)\n` +
          `• Bebas menggunakan bot di *Private Chat*\n` +
          `• Akses seluruh fitur tanpa hambatan\n\n` +
          `Hubungi Owner untuk upgrade ke Premium:\n` +
          `Ketik: *${usedPrefix || config.prefix}owner*`
        );
      }

      // Kurangi limit 1 poin untuk perintah berbayar
      user.limit -= 1;
      user.totalCommands = (user.totalCommands || 0) + 1;
      db.save();
    }

    // Eksekusi Command dengan dukungan fleksibel untuk signature fungsi:
    // Model 1: execute({ sock, m, args, text, ... }) (Destructured object)
    // Model 2: execute(sock, m, args, text) (Positional arguments)
    const context = {
      sock,
      m,
      args,
      text,
      command,
      groupMetadata,
      isOwner: m.isOwner,
      isAdmin,
      isBotAdmin,
      user
    };

    const fnStr = cmd.execute.toString().trim();
    const isDestructured = /^(async\s*)?(function\s*)?(\w+\s*)?\(\s*\{/.test(fnStr);

    try {
      if (isDestructured || cmd.execute.length <= 1) {
        await cmd.execute(context);
      } else {
        await cmd.execute(sock, m, args, text, context);
      }
    } catch (cmdErr) {
      await handlePlatformError(sock, m, command, cmdErr);
    }

  } catch (err) {
    await handlePlatformError(sock, m, command, err);
  }
};
