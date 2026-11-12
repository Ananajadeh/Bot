/**
 * Serializer Pesan Baileys
 * Memudahkan akses data pesan (chat, sender, body, quoted, dll)
 * Mendukung format nomor internasional, pemetaan LID WhatsApp, dan unwrap pesan grup.
 */

const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const config = require('../config');

// Helper normalisasi nomor telepon ke format internasional (62xxx)
function normalizeNumber(num) {
  if (!num) return '';
  // Ambil hanya bagian sebelum @ dan sebelum : (menghilangkan suffix device)
  let base = String(num).split('@')[0].split(':')[0];
  let cleaned = base.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return cleaned;
}

// Helper resolusi LID ke nomor telepon asli jika tersedia di direktori sesi
function resolvePhoneNumber(jid, sessionDir = './session') {
  if (!jid) return '';
  const num = normalizeNumber(jid);
  if (jid.includes('@lid') || num.length > 13) {
    try {
      const lidFile = path.join(path.resolve(sessionDir), `lid-mapping-${num}_reverse.json`);
      if (fs.existsSync(lidFile)) {
        const mapped = JSON.parse(fs.readFileSync(lidFile, 'utf8'));
        if (mapped) return normalizeNumber(mapped);
      }
    } catch {}
  }
  return num;
}

// Helper unwrap wrapper pesan WhatsApp (ephemeral, viewOnce, dll)
function unwrapMessage(msg) {
  if (!msg) return {};
  let current = msg;
  while (current) {
    const keys = Object.keys(current);
    if (!keys.length) break;
    const topKey = keys[0];
    if (
      (topKey === 'ephemeralMessage' ||
        topKey === 'viewOnceMessage' ||
        topKey === 'viewOnceMessageV2' ||
        topKey === 'documentWithCaptionMessage') &&
      current[topKey]?.message
    ) {
      current = current[topKey].message;
    } else {
      break;
    }
  }
  return current;
}

function serialize(sock, rawMsg) {
  if (!rawMsg) return null;

  const m = { ...rawMsg };

  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id && (m.id.startsWith('BAE5') || m.id.length === 16);
    m.chat = m.key.remoteJid;
    m.fromMe = Boolean(m.key.fromMe);
    m.isGroup = m.chat.endsWith('@g.us');

    // Menentukan pengirim pesan secara akurat (Private / Group / FromMe)
    if (m.fromMe) {
      m.sender = (sock.user && (sock.user.id.split(':')[0] + '@s.whatsapp.net')) || m.chat;
    } else if (m.isGroup) {
      m.sender = m.key.participant || rawMsg.participant || m.chat;
    } else {
      m.sender = m.chat;
    }
  }

  // Bersihkan device suffix (:1, :0) dari m.sender
  const cleanSender = m.sender ? m.sender.replace(/:[0-9]+/g, '') : '';
  const rawSenderNum = normalizeNumber(cleanSender);
  const resolvedPhoneNum = resolvePhoneNumber(cleanSender, config.sessionDir);

  m.sender = cleanSender;
  m.senderNumber = resolvedPhoneNum || rawSenderNum;
  m.senderLid = cleanSender.endsWith('@lid') ? rawSenderNum : '';

  // Verifikasi status Owner
  const normalizedOwners = (Array.isArray(config.ownerNumber) ? config.ownerNumber : [config.ownerNumber])
    .map(normalizeNumber);

  m.isOwner =
    m.fromMe ||
    normalizedOwners.includes(rawSenderNum) ||
    normalizedOwners.includes(resolvedPhoneNum);

  m.pushName = m.pushName || 'User';

  if (m.message) {
    const actualMsg = unwrapMessage(m.message);
    m.type = Object.keys(actualMsg)[0] || '';
    m.msg = actualMsg[m.type];

    // Ekstraksi teks pesan dari berbagai kemungkinan jenis pesan
    m.body =
      actualMsg.conversation ||
      actualMsg.extendedTextMessage?.text ||
      actualMsg.imageMessage?.caption ||
      actualMsg.videoMessage?.caption ||
      actualMsg.documentMessage?.caption ||
      actualMsg.buttonsResponseMessage?.selectedButtonId ||
      actualMsg.listResponseMessage?.singleSelectReply?.selectedRowId ||
      actualMsg.templateButtonReplyMessage?.selectedId ||
      actualMsg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
      '';

    m.body = m.body || '';

    // Ekstraksi Quoted Message (Pesan yang dibalas)
    const contextInfo = actualMsg[m.type]?.contextInfo || actualMsg.extendedTextMessage?.contextInfo;
    m.mentionedJid = contextInfo?.mentionedJid || [];

    if (contextInfo && contextInfo.quotedMessage) {
      const q = unwrapMessage(contextInfo.quotedMessage);
      const qType = Object.keys(q)[0] || '';
      const qMsg = q[qType];
      const qSender = contextInfo.participant ? contextInfo.participant.replace(/:[0-9]+/g, '') : '';
      const qSenderNum = resolvePhoneNumber(qSender, config.sessionDir);

      m.quoted = {
        key: {
          remoteJid: m.chat,
          fromMe: contextInfo.participant === (sock.user && (sock.user.id.split(':')[0] + '@s.whatsapp.net')),
          id: contextInfo.stanzaId,
          participant: contextInfo.participant
        },
        id: contextInfo.stanzaId,
        sender: qSender,
        senderNumber: qSenderNum,
        type: qType,
        isMedia: ['imageMessage', 'videoMessage', 'stickerMessage', 'audioMessage', 'documentMessage'].includes(qType),
        message: q,
        text:
          q.conversation ||
          q.extendedTextMessage?.text ||
          q.imageMessage?.caption ||
          q.videoMessage?.caption ||
          q.documentMessage?.caption ||
          ''
      };
    } else {
      m.quoted = null;
    }
  }

  // Method pembantu membalas pesan secara langsung (Aman untuk grup dan quoted)
  m.reply = async (text, options = {}) => {
    try {
      return await sock.sendMessage(m.chat, { text, ...options }, { quoted: rawMsg });
    } catch {
      // Fallback tanpa quoted jika quoted participant menyebabkan isu stanza
      return await sock.sendMessage(m.chat, { text, ...options });
    }
  };

  // Method pembantu react emoji
  m.react = async (emoji) => {
    return sock.sendMessage(m.chat, {
      react: { text: emoji, key: m.key }
    });
  };

  // Method pembantu download media dari pesan langsung atau pesan yang dibalas
  m.download = async () => {
    try {
      let targetNode = null;
      let mediaType = '';

      if (m.quoted && m.quoted.isMedia) {
        mediaType = m.quoted.type.replace('Message', '').toLowerCase();
        targetNode = m.quoted.message ? (m.quoted.message[m.quoted.type] || m.quoted.msg) : null;
      } else if (['imageMessage', 'videoMessage', 'stickerMessage', 'audioMessage', 'documentMessage'].includes(m.type)) {
        mediaType = m.type.replace('Message', '').toLowerCase();
        targetNode = m.msg || (m.message && m.message[m.type]);
      }

      if (!targetNode || !mediaType) return null;

      const stream = await downloadContentFromMessage(targetNode, mediaType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      return buffer;
    } catch {
      return null;
    }
  };

  return m;
}

module.exports = {
  serialize,
  normalizeNumber,
  resolvePhoneNumber
};
