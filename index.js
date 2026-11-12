/**
 * MAIN ENTRY POINT - nayxilaa md WhatsApp Bot
 * Menggunakan @whiskeysockets/baileys dengan dukungan Pairing Code & 24/7 Watchdog
 */

const dns = require('dns');
// Paksa prioritas IPv4 untuk menghindari ENETUNREACH pada server/jaringan tanpa IPv6
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  delay
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const config = require('./config');
const { loadCommands } = require('./lib/loader');
const messageHandler = require('./handler');
const { info, success, warn, error, colorize } = require('./lib/color');
const { db } = require('./lib/database');

// Helper input terminal untuk Pairing Code
const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
};

let currentSock = null;
let heartbeatInterval = null;
let isReconnecting = false;

async function startBot() {
  console.log(colorize('brightCyan', `
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║        ███╗   ██╗ █████╗ ██╗   ██╗██╗  ██╗        ║
  ║        ████╗  ██║██╔══██╗╚██╗ ██╔╝╚██╗██╔╝        ║
  ║        ██╔██╗ ██║███████║ ╚████╔╝  ╚███╔╝         ║
  ║        ██║╚██╗██║██╔══██║  ╚██╔╝   ██╔██╗         ║
  ║        ██║ ╚████║██║  ██║   ██║   ██╔╝ ██╗        ║
  ║        ╚═╝  ╚═══╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝        ║
  ║                                                   ║
  ║               N A Y X I L A A   M D               ║
  ║             WhatsApp Bot Multi-Device             ║
  ║                  (ONLINE 24 JAM)                  ║
  ╚═══════════════════════════════════════════════════╝
  `));

  info(`Memuat modul & perintah bot...`);
  loadCommands();

  // Pastikan direktori sesi ada
  const sessionPath = path.resolve(config.sessionDir);
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  info(`Menggunakan Baileys versi v${version.join('.')}${isLatest ? ' (Terbaru)' : ''}`);

  // Inisialisasi Socket Baileys dengan konfigurasi stabil untuk 24/7
  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: !config.pairingCode,
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    keepAliveIntervalMs: 25000,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    retryRequestDelayMs: 2000
  });

  currentSock = sock;

  // Logika Pairing Code jika belum terdaftar
  if (config.pairingCode && !sock.authState.creds.registered) {
    let phoneNumber = config.botNumber;

    if (!phoneNumber) {
      console.log('\n' + colorize('brightYellow', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(colorize('brightWhite', '         SETUP KONEKSI BOT (PAIRING CODE)'));
      console.log(colorize('brightYellow', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(colorize('white', ' Masukkan nomor WhatsApp yang akan digunakan sebagai BOT.'));
      console.log(colorize('white', ' Contoh: 083841800798 atau 6283841800798\n'));

      phoneNumber = await askQuestion(colorize('brightGreen', ' 👉 Masukkan Nomor WhatsApp Bot: '));
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '62' + phoneNumber.slice(1);
    }

    info(`Meminta Pairing Code untuk nomor: +${phoneNumber}...`);

    try {
      await delay(3000);
      const code = await sock.requestPairingCode(phoneNumber);
      const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;

      console.log('\n' + colorize('brightGreen', '╔═══════════════════════════════════════════════════╗'));
      console.log(colorize('brightGreen', '║             KODE PAIRING WHATSAPP ANDA            ║'));
      console.log(colorize('brightGreen', '╠═══════════════════════════════════════════════════╣'));
      console.log(colorize('brightYellow', `║                    ${formattedCode.padEnd(10, ' ')}                     ║`));
      console.log(colorize('brightGreen', '╚═══════════════════════════════════════════════════╝'));
      console.log(colorize('brightCyan', '\n 📌 Panduan Memasukkan Kode di WhatsApp HP:'));
      console.log(colorize('white', '  1. Buka WhatsApp di smartphone Anda'));
      console.log(colorize('white', '  2. Ketuk ikon titik tiga (⋮) > Perangkat Tertaut'));
      console.log(colorize('white', '  3. Ketuk "Tautkan Perangkat"'));
      console.log(colorize('white', '  4. Pilih "Tautkan dengan nomor telepon saja" di bawah layar'));
      console.log(colorize('brightYellow', `  5. Masukkan 8 karakter kode: ${formattedCode}\n`));
    } catch (err) {
      error(`Gagal meminta pairing code: ${err.message}`);
    }
  }

  // Simpan pembaharuan kredensial sesi
  sock.ev.on('creds.update', saveCreds);

  // Watchdog Reconnect Handler
  const triggerReconnect = (reason) => {
    if (isReconnecting) return;
    isReconnecting = true;
    warn(`[WATCHDOG 24/7] Memicu koneksi ulang otomatis: ${reason}`);

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    try {
      sock.ev.removeAllListeners();
      sock.ws?.close?.();
      sock.end?.();
    } catch {}

    setTimeout(() => {
      isReconnecting = false;
      startBot().catch((err) => {
        error(`Gagal memulai ulang bot: ${err.message}`);
      });
    }, 3000);
  };

  // Penanganan Status Koneksi
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !config.pairingCode) {
      info('Silakan scan QR code di atas.');
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      warn(`Koneksi terputus! Status Code: ${reason || 'Unknown'}`);

      if (reason === DisconnectReason.badSession) {
        error(`File sesi rusak. Silakan hapus folder '${config.sessionDir}' dan sambungkan ulang.`);
      } else if (reason === DisconnectReason.loggedOut) {
        error(`Perangkat telah dikeluarkan (Logout). Hapus folder '${config.sessionDir}' dan pairing ulang.`);
      } else if (reason === DisconnectReason.connectionReplaced) {
        error('Sesi bot dibuka di tempat lain. Bot dinonaktifkan.');
      } else {
        triggerReconnect(`DisconnectReason (${reason || 'Unknown'})`);
      }
    } else if (connection === 'open') {
      isReconnecting = false;
      success('====================================================');
      success(`  KONEKSI BERHASIL! ${config.botName.toUpperCase()} AKTIF`);
      success('====================================================');
      info(`Nama Bot    : ${config.botName}`);
      info(`Nama Owner  : ${config.ownerName}`);
      info(`Nomor Owner : ${Array.isArray(config.ownerNumber) ? config.ownerNumber.join(', ') : config.ownerNumber}`);
      info(`Prefix Aktif: ${config.prefix}`);
      info(`Mode Aktif  : ${config.mode.toUpperCase()}`);
      info(`Bot JID     : ${sock.user.id.split(':')[0]}@s.whatsapp.net`);
      success('====================================================\n');

      // Interval berkala: Cek reset limit pukul 05:00 WIB & kedaluwarsa sewa setiap 60 detik
      if (!global.checkerInterval) {
        global.checkerInterval = setInterval(() => {
          try {
            db.checkResetLimit();
            db.checkExpiredRent(sock);
          } catch {}
        }, 60000);
      }

      // Heartbeat Watchdog 24 Jam: Cegah Zombie Socket di Termux / Android
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(async () => {
        try {
          if (!sock.ws || sock.ws.readyState !== 1) { // 1 = WebSocket.OPEN
            warn('[WATCHDOG 24/7] WebSocket tidak berstatus OPEN. Merestart koneksi...');
            triggerReconnect('WebSocket state not OPEN');
            return;
          }
          // Kirim ping ringan agar jaringan tidak tertidur (keep-alive)
          await sock.sendPresenceUpdate('available');
        } catch (pingErr) {
          warn(`[WATCHDOG 24/7] Ping gagal (${pingErr.message}), merestart koneksi...`);
          triggerReconnect('Heartbeat ping failed');
        }
      }, 30000);
    }
  });

  // Penanganan Pesan Masuk (Upsert) - Non-blocking Concurrency
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const messages = chatUpdate.messages;
      if (!messages || !messages.length) return;
      for (const rawMsg of messages) {
        if (!rawMsg.message) continue;
        // Non-blocking: tangani setiap pesan secara independen
        messageHandler(sock, rawMsg).catch((err) => {
          error(`Error penanganan pesan: ${err.message}`);
        });
      }
    } catch (err) {
      error(`Error pada event messages.upsert: ${err.message}`);
    }
  });

  // Penanganan Anggota Masuk / Keluar Grup (Welcome & Goodbye Member)
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { id, participants, action } = update;
      if (!id || !id.endsWith('@g.us') || !Array.isArray(participants)) return;

      const group = db.getGroup(id);
      let groupMetadata = null;
      try {
        groupMetadata = await sock.groupMetadata(id);
      } catch {}

      const groupSubject = groupMetadata?.subject || group?.name || 'Grup WhatsApp';
      const groupDesc = groupMetadata?.desc ? groupMetadata.desc.toString() : '';

      if (action === 'add' && group.welcome) {
        for (const user of participants) {
          const userNum = user.split('@')[0];
          const totalMembers = groupMetadata?.participants?.length || '-';
          const welcomeMsg =
            `╭───「 *WELCOME TO GROUP* 」───\n` +
            `│ 👋 Halo @${userNum}\n` +
            `│ 🏷️ Selamat datang di *${groupSubject}*\n` +
            `│ 👥 Anggota ke: *${totalMembers}*\n` +
            `╰────────────────────────\n\n` +
            (groupDesc ? `📌 *Deskripsi Grup:*\n${groupDesc}\n\n` : '') +
            `_Semoga betah dan jangan lupa patuhi aturan grup ya!_`;

          await sock.sendMessage(id, {
            text: welcomeMsg,
            mentions: [user]
          });
        }
      } else if (action === 'remove' && group.goodbye) {
        for (const user of participants) {
          const userNum = user.split('@')[0];
          const goodbyeMsg =
            `╭───「 *GOODBYE MEMBER* 」───\n` +
            `│ 👋 Selamat tinggal @${userNum}\n` +
            `│ 🏷️ Dari grup *${groupSubject}*\n` +
            `╰────────────────────────\n\n` +
            `_Terima kasih atas kebersamaannya selama ini!_`;

          await sock.sendMessage(id, {
            text: goodbyeMsg,
            mentions: [user]
          });
        }
      }
    } catch (err) {
      error(`Error pada event group-participants.update: ${err.message}`);
    }
  });

  return sock;
}

// Pencegahan crash tak terduga (agar proses tidak mati & tampil di platform WhatsApp)
process.on('uncaughtException', async (err) => {
  error(`Uncaught Exception: ${err.stack || err.message}`);
  try {
    if (currentSock && currentSock.user) {
      const rawOwner = Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : config.ownerNumber;
      let ownerNum = String(rawOwner || '').replace(/[^0-9]/g, '');
      if (ownerNum.startsWith('0')) ownerNum = '62' + ownerNum.slice(1);
      if (ownerNum.length >= 8) {
        const ownerJid = `${ownerNum}@s.whatsapp.net`;
        const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        await currentSock.sendMessage(ownerJid, {
          text:
            `🚨 *CRITICAL SYSTEM ERROR (UNCAUGHT EXCEPTION)* 🚨\n\n` +
            `◦ *Waktu :* ${time} WIB\n` +
            `◦ *Tipe  :* ${err.name || 'Error'}\n` +
            `◦ *Pesan :* ${err.message}\n\n` +
            `*Stack Trace:*\n\`\`\`\n${(err.stack || '').slice(0, 800)}\n\`\`\``
        });
      }
    }
  } catch {}
});

process.on('unhandledRejection', async (reason) => {
  error(`Unhandled Rejection: ${reason?.stack || reason}`);
  try {
    if (currentSock && currentSock.user) {
      const rawOwner = Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : config.ownerNumber;
      let ownerNum = String(rawOwner || '').replace(/[^0-9]/g, '');
      if (ownerNum.startsWith('0')) ownerNum = '62' + ownerNum.slice(1);
      if (ownerNum.length >= 8) {
        const ownerJid = `${ownerNum}@s.whatsapp.net`;
        const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const errMsg = typeof reason === 'object' && reason?.message ? reason.message : String(reason);
        const errStack = typeof reason === 'object' && reason?.stack ? reason.stack : String(reason);
        await currentSock.sendMessage(ownerJid, {
          text:
            `🚨 *CRITICAL SYSTEM ERROR (UNHANDLED REJECTION)* 🚨\n\n` +
            `◦ *Waktu  :* ${time} WIB\n` +
            `◦ *Alasan :* ${errMsg}\n\n` +
            `*Detail:*\n\`\`\`\n${errStack.slice(0, 800)}\n\`\`\``
        });
      }
    }
  } catch {}
});

// Jalankan Bot
startBot();
