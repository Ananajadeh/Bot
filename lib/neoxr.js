/**
 * Helper Neoxr REST API Client
 * Dokumentasi: https://api.neoxr.eu
 */

const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('../config');

const BASE_URL = 'https://api.neoxr.eu/api';

// Konfigurasi axios client khusus IPv4 agar koneksi cepat & stabil
const client = axios.create({
  baseURL: BASE_URL,
  httpAgent: new http.Agent({ family: 4, keepAlive: true }),
  httpsAgent: new https.Agent({ family: 4, keepAlive: true }),
  timeout: 60000
});

class Neoxr {
  constructor(apiKey = config.neoxrApiKey) {
    this.apiKey = apiKey;
  }

  get key() {
    return this.apiKey || config.neoxrApiKey;
  }

  /**
   * Cek Status & Limit Akun Neoxr
   */
  async check() {
    try {
      const res = await client.get('/check', {
        params: { apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * TikTok Downloader (Video No Watermark & Audio)
   * @param {string} url
   */
  async tiktok(url) {
    try {
      const res = await client.get('/tiktok', {
        params: { url, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Instagram Downloader (Reels, Post, Story)
   * @param {string} url
   */
  async ig(url) {
    try {
      const res = await client.get('/ig', {
        params: { url, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Instagram Story by Username
   * @param {string} username
   */
  async igs(username) {
    try {
      const res = await client.get('/igs', {
        params: { username, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Facebook Downloader (Reels, Video, Post)
   * @param {string} url
   */
  async fb(url) {
    try {
      const res = await client.get('/fb', {
        params: { url, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * CapCut Downloader (Template, Video)
   * @param {string} url
   */
  async capcut(url) {
    try {
      const res = await client.get('/capcut', {
        params: { url, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Pinterest Downloader
   * @param {string} url
   */
  async pin(url) {
    try {
      const res = await client.get('/pin', {
        params: { url, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Pinterest Search
   * @param {string} query
   */
  async pinterestSearch(query) {
    try {
      const res = await client.get('/pinterest', {
        params: { q: query, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Brat Text Maker (Image PNG)
   * @param {string} text
   */
  async brat(text) {
    try {
      const res = await client.get('/brat', {
        params: { text, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Brat Video Maker (Animated MP4)
   * @param {string} text
   */
  async bratvid(text) {
    try {
      const res = await client.get('/bratvid', {
        params: { text, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * YouTube Downloader (Audio / Video)
   * @param {string} url
   * @param {'audio' | 'video'} type
   * @param {'128kbps' | '360p' | '720p'} quality
   */
  async youtube(url, type = 'video', quality = '360p') {
    try {
      const res = await client.get('/youtube', {
        params: { url, type, quality, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * YouTube Play (Cari judul lagu & download MP3)
   * @param {string} query
   */
  async play(query) {
    try {
      const res = await client.get('/play', {
        params: { q: query, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Helper mengambil buffer file media
   * @param {string} url
   */
  async getBuffer(url) {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      httpAgent: new http.Agent({ family: 4 }),
      httpsAgent: new https.Agent({ family: 4 }),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      timeout: 60000
    });
    return Buffer.from(res.data);
  }

  /**
   * Helper mengambil media buffer lengkap dengan auto-deteksi tipe video / image
   * @param {string} url
   * @returns {Promise<{ buffer: Buffer, contentType: string, isVideo: boolean }>}
   */
  async getMediaBuffer(url) {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      httpAgent: new http.Agent({ family: 4 }),
      httpsAgent: new https.Agent({ family: 4 }),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      timeout: 60000
    });

    const buffer = Buffer.from(res.data);
    const contentType = (res.headers['content-type'] || '').toLowerCase();

    let isVideo = false;
    if (contentType.startsWith('video/')) {
      isVideo = true;
    } else if (contentType.startsWith('image/')) {
      isVideo = false;
    } else if (buffer.length >= 8) {
      const ftyp = buffer.slice(4, 8).toString();
      if (ftyp === 'ftyp' || buffer.slice(0, 4).toString('hex') === '1a45dfa3') {
        isVideo = true;
      }
    }

    return {
      buffer,
      contentType,
      isVideo
    };
  }

  /**
   * ATTP - Animated Text to Picture (Rainbow)
   * @param {string} text
   */
  async attp(text) {
    try {
      const res = await client.get('/attp', {
        params: { text, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * ATTP2 - Animated Text to Picture style 2
   * @param {string} text
   */
  async attp2(text) {
    try {
      const res = await client.get('/attp2', {
        params: { text, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * ATTP3 - Animated Text to Picture style 3
   * @param {string} text
   */
  async attp3(text) {
    try {
      const res = await client.get('/attp3', {
        params: { text, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * IQC - iPhone Quoted Chat
   * @param {string} text
   * @param {string} name
   * @param {string} avatar - URL foto profil
   */
  async iqc(text, name, avatar) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace('.', ':');

    const params = {
      text,
      name: name || 'User',
      time: timeStr,
      chat_time: timeStr,
      apikey: this.key
    };

    if (avatar && typeof avatar === 'string' && avatar.startsWith('http')) {
      params.avatar = avatar;
    }

    try {
      const res = await client.get('/iqc', { params });
      return res.data;
    } catch (err) {
      // Jika request gagal karena avatar, coba lagi tanpa avatar
      if (params.avatar) {
        try {
          delete params.avatar;
          const retryRes = await client.get('/iqc', { params });
          return retryRes.data;
        } catch {}
      }
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Meme Generator
   * @param {string} top - Teks atas
   * @param {string} bottom - Teks bawah
   * @param {string} image - URL gambar meme
   */
  async meme(top, bottom, image) {
    try {
      const params = {
        image,
        top: top || '',
        bottom: bottom || '',
        apikey: this.key
      };
      const res = await client.get('/memegen', { params });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Nulis - Membuat tulisan tangan di kertas
   * @param {string} text
   */
  async nulis(text) {
    try {
      const res = await client.get('/nulis', {
        params: { text, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Quotely - WhatsApp Web Quoted Chat Maker
   * @param {string} text
   * @param {string} name
   * @param {string} avatar - URL foto profil
   */
  async quotely(text, name, avatar) {
    try {
      const quoteApi = require('@neoxr/quote-api');
      const hasAvatar = Boolean(avatar && typeof avatar === 'string' && avatar.startsWith('http'));
      const msgObj = {
        entities: [],
        avatar: hasAvatar,
        from: {
          id: 1,
          name: name || 'User'
        },
        text: text,
        replyMessage: {}
      };
      if (hasAvatar) {
        msgObj.from.photo = { url: avatar };
      }

      const json = {
        type: 'quote',
        format: 'png',
        backgroundColor: '#FFFFFF',
        width: 512,
        height: 768,
        scale: 2,
        messages: [msgObj]
      };

      const res = await quoteApi(json);
      if (res && res.image) {
        return {
          status: true,
          data: {
            buffer: Buffer.from(res.image, 'base64')
          }
        };
      }
      throw new Error(res?.error || 'Gagal membuat gambar quotely.');
    } catch (err) {
      // Jika terjadi error saat memuat avatar, retry tanpa avatar
      if (avatar) {
        return this.quotely(text, name, '');
      }
      throw new Error(err.message);
    }
  }

  /**
   * Emoji Mix - Gabungkan dua emoji menjadi satu
   * @param {string} emoji1
   * @param {string} emoji2
   */
  async emojimix(emoji1, emoji2) {
    try {
      const res = await client.get('/emoji', {
        params: { q: `${emoji1}_${emoji2}`, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Emoji to Animation (Emojito) - Konversi emoji menjadi animasi Google Noto Emoji
   * @param {string} emoji
   */
  async emojito(emoji) {
    try {
      const res = await client.get('/emojito', {
        params: { q: emoji, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Remini - AI Image Enhancer / Upscale
   * @param {string} image - URL gambar yang akan di-enhance
   */
  async remini(image) {
    try {
      const res = await client.get('/remini', {
        params: { image, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Remove Background - Hapus latar belakang gambar
   * @param {string} image - URL gambar
   */
  async removebg(image) {
    try {
      const res = await client.get('/nobg', {
        params: { image, apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Upload gambar ke server CDN resmi Neoxr (secure-signed.pages.dev)
   * @param {Buffer} buffer
   * @returns {Promise<string>} URL gambar
   */
  async uploadImage(buffer) {
    return this.uploadFile(buffer, 'image.jpg', 'image/jpeg');
  }

  /**
   * Upload file/dokumen/gambar ke server CDN resmi Neoxr (secure-signed.pages.dev)
   * @param {Buffer} buffer
   * @param {string} filename
   * @param {string} contentType
   * @returns {Promise<string>} URL file
   */
  async uploadFile(buffer, filename = 'document.pdf', contentType = 'application/pdf') {
    const FormData = require('form-data');
    const uploadEndpoints = [
      'https://secure-signed.pages.dev/api/upload',
      'https://cryvo.pages.dev/api/upload'
    ];

    for (const endpoint of uploadEndpoints) {
      try {
        const form = new FormData();
        form.append('file', buffer, { filename, contentType });
        const res = await axios.post(endpoint, form, {
          headers: form.getHeaders(),
          httpAgent: new http.Agent({ family: 4 }),
          httpsAgent: new https.Agent({ family: 4 }),
          timeout: 60000
        });
        const url = res.data?.data?.url;
        if (url) return url;
      } catch (err) {
        // Coba endpoint cadangan
      }
    }
    throw new Error('Gagal mengunggah file ke server CDN.');
  }

  /**
   * PDF Converter via Neoxr API (Convert PDF to DOCX, PPTX, PSD, JPG, PNG, XSLX)
   * @param {string} url - URL file PDF
   * @param {string} filename - Nama file PDF
   * @param {string} to - Format target (docx, pptx, psd, jpg, png, xslx)
   */
  async pdfConvert(url, filename, to = 'docx') {
    try {
      const res = await client.get('/pdf2docx', {
        params: { url, filename, to, apikey: this.key },
        timeout: 120000
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * AI Chat (Bard / Gemini via Neoxr)
   * Persona: Humble (Rendah Hati), Enjoy & Chill (Santai Luwes), Friendly, Apresiasi Tulus, Sedikit Candaan Disensor (anjink, bjir, bgsd)
   * @param {string} query
   * @param {string} pushName
   */
  async aiChat(query, pushName = 'Kak') {
    try {
      const prompt = `Kamu adalah AI asisten WhatsApp bernama 'nayxilaa md'. Kamu sedang mengobrol santai dengan kawanmu, ${pushName}.

Karakter & Gaya Bicaramu:
1. LEBIH HUMBLE & RENDAH HATI:
   - Bersahaja, tulus, hangat, sopan tapi tidak kaku, dan sangat menghargai lawan bicara.
   - Hindari kesan sombong, sok pintar, atau menggurui. Posisikan dirimu sebagai sahabat mengobrol yang ramah dan humble.
2. LEBIH ENJOY & CHILL:
   - Santai, luwes, mengalir alami seperti sedang nongkrong ngopi bareng kawan akrab.
   - Bikin suasana percakapan jadi nyaman, seru, dan menyenangkan tanpa dibuat-buat atau berlebihan.
3. PUJIAN YANG TULUS & HUMBLE:
   - Selipkan sedikit apresiasi/pujian yang wajar dan bersahabat (contoh: 'keren sih lu', 'mantap pemikiran lu', 'salut gua', 'asik juga ide lu').
4. SEDIKIT BERCANDA DENGAN KATA SENSOR KHAS TONGKRONGAN:
   - Sesekali selipkan umpatan/candaan santai tongkrongan TAPI WAJIB DISENSOR (contoh: 'anjink', 'bjir', 'anjir', 'bgsd'). DILARANG menggunakan kata kasar tanpa sensor (selalu gunakan bentuk sensor seperti 'anjink', bukan 'anjing').
5. JELAS & MEMBANTU:
   - Berikan jawaban yang informatif, jelas, enak dibaca, dan benar-benar membantu pertanyaan user.

Pertanyaan / Pesan dari ${pushName}:
${query}`;

      const res = await client.get('/bard', {
        params: {
          q: prompt,
          apikey: this.key
        }
      });

      if (!res.data || !res.data.status) {
        throw new Error(res.data?.msg || 'Gagal mendapatkan respon dari AI.');
      }

      const rawMsg = res.data.data?.message || res.data.data || '';
      return sanitizeCensoredWords(rawMsg);
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Google Bard AI (Image Generator)
   * @param {string} prompt
   */
  async bardimg(prompt) {
    try {
      const res = await client.get('/bardimg', {
        params: { q: prompt, apikey: this.key },
        timeout: 90000
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Game Asah Otak
   */
  async asahotak() {
    try {
      const res = await client.get('/asahotak', {
        params: { apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Game Siapa Aku (Who Am I)
   */
  async whoami() {
    try {
      const res = await client.get('/whoami', {
        params: { apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Game Susun Kata (What Word)
   */
  async whatword() {
    try {
      const res = await client.get('/whatword', {
        params: { apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Game Tebak Gambar (What Image)
   */
  async whatimg() {
    try {
      const res = await client.get('/whatimg', {
        params: { apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Game Teka-Teki
   */
  async tekateki() {
    try {
      const res = await client.get('/tekateki', {
        params: { apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Game Tebak Bendera (What Flag)
   */
  async whatflag() {
    try {
      const res = await client.get('/whatflag', {
        params: { apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Game Tebak Lagu (What Song)
   */
  async whatsong() {
    try {
      const res = await client.get('/whatsong', {
        params: { apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Game Kuis / Survey (Quiz)
   */
  async quiz() {
    try {
      const res = await client.get('/quiz', {
        params: { apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Game Truth
   */
  async truth() {
    try {
      const res = await client.get('/truth', {
        params: { apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }

  /**
   * Game Dare
   */
  async dare() {
    try {
      const res = await client.get('/dare', {
        params: { apikey: this.key }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || err.message);
    }
  }
}

// Helper sensor kata-kata kasar agar ramah, humble & enjoy
function sanitizeCensoredWords(text) {
  if (!text) return '';
  // Bersihkan tag sensor bawaan jika ada dari model
  let result = text.replace(/\[\s*sensor\s*\]/gi, '').replace(/\*\s*\[\s*sensor\s*\]\s*\*/gi, '');

  const map = [
    [/\banjing\b/gi, 'anjink'],
    [/\banjeng\b/gi, 'anjink'],
    [/\bajg\b/gi, 'anjink'],
    [/\bbabi\b/gi, 'b4bi'],
    [/\bbangsat\b/gi, 'bgsd'],
    [/\bbangsatt\b/gi, 'bgsd'],
    [/\bkontol\b/gi, 'kntl'],
    [/\bkntol\b/gi, 'kntl'],
    [/\bmemek\b/gi, 'mmk'],
    [/\basu\b/gi, '4su'],
    [/\bbajingan\b/gi, 'bjink'],
    [/\bpantek\b/gi, 'p4ntek'],
    [/\btolol\b/gi, 'tlol'],
    [/\bgoblok\b/gi, 'gblg'],
    [/\bkampret\b/gi, 'kmpret']
  ];

  for (const [pattern, replacement] of map) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

module.exports = new Neoxr();
module.exports.sanitizeCensoredWords = sanitizeCensoredWords;
