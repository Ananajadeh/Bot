/**
 * Helper WhatsApp Sticker Converter
 * Mengubah gambar, video, dan animasi GIF menjadi stiker WhatsApp WebP (512x512)
 * Dilengkapi dengan metadata EXIF resmi (Packname & Author)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const config = require('../config');

/**
 * Membuat buffer Exif untuk WhatsApp sticker pack
 * @param {string} packname
 * @param {string} author
 * @returns {Buffer}
 */
function createExif(packname = config.botName, author = config.ownerName) {
  const json = {
    'sticker-pack-id': 'nayxilaa-md-bot',
    'sticker-pack-name': packname || config.botName,
    'sticker-pack-publisher': author || config.ownerName,
    'emojis': ['🤖', '✨']
  };

  const jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
  const exif = Buffer.concat([
    Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00]),
    Buffer.from([
      jsonBuf.length & 0xff,
      (jsonBuf.length >> 8) & 0xff,
      (jsonBuf.length >> 16) & 0xff,
      (jsonBuf.length >> 24) & 0xff
    ]),
    Buffer.from([0x16, 0x00, 0x00, 0x00]),
    jsonBuf
  ]);

  return exif;
}

/**
 * Injeksi EXIF metadata ke dalam WebP menggunakan webpmux
 * @param {string} webpPath
 * @param {Buffer} exifBuf
 * @param {string} outputPath
 */
async function injectExif(webpPath, exifBuf, outputPath) {
  const tmpExif = path.join(os.tmpdir(), `exif_${Date.now()}_${Math.random().toString(36).slice(2)}.exif`);
  try {
    await fs.promises.writeFile(tmpExif, exifBuf);
    await execAsync(`webpmux -set exif "${tmpExif}" "${webpPath}" -o "${outputPath}"`);
  } catch {
    // Jika webpmux gagal, copy webpPath as fallback
    if (webpPath !== outputPath) {
      await fs.promises.copyFile(webpPath, outputPath);
    }
  } finally {
    try { await fs.promises.unlink(tmpExif); } catch {}
  }
}

/**
 * Konversi Buffer Gambar ke Stiker WebP (512x512)
 * @param {Buffer} buffer
 * @param {string} packname
 * @param {string} author
 * @returns {Promise<Buffer>}
 */
async function imageToSticker(buffer, packname = config.botName, author = config.ownerName) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const tmpIn = path.join(os.tmpdir(), `img_in_${id}.tmp`);
  const tmpOut = path.join(os.tmpdir(), `img_out_${id}.webp`);
  const tmpFinal = path.join(os.tmpdir(), `img_final_${id}.webp`);

  try {
    await fs.promises.writeFile(tmpIn, buffer);

    // Filter ffmpeg untuk resize proporsional 512x512 dengan padding transparan
    const ffmpegCmd = `ffmpeg -y -i "${tmpIn}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -vcodec libwebp -lossless 0 -compression_level 4 -q:v 75 -an -fps_mode passthrough "${tmpOut}"`;
    await execAsync(ffmpegCmd);

    const exifBuf = createExif(packname, author);
    await injectExif(tmpOut, exifBuf, tmpFinal);

    return await fs.promises.readFile(tmpFinal);
  } finally {
    try { await fs.promises.unlink(tmpIn); } catch {}
    try { await fs.promises.unlink(tmpOut); } catch {}
    try { await fs.promises.unlink(tmpFinal); } catch {}
  }
}

/**
 * Konversi Buffer Video/GIF ke Stiker WebP Animasi (512x512, < 1MB)
 * @param {Buffer} buffer
 * @param {string} packname
 * @param {string} author
 * @returns {Promise<Buffer>}
 */
async function videoToSticker(buffer, packname = config.botName, author = config.ownerName) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const tmpIn = path.join(os.tmpdir(), `vid_in_${id}.tmp`);
  const tmpOut = path.join(os.tmpdir(), `vid_out_${id}.webp`);
  const tmpFinal = path.join(os.tmpdir(), `vid_final_${id}.webp`);

  try {
    await fs.promises.writeFile(tmpIn, buffer);

    // Durasi maksimal 7 detik, 15 fps, kualitas seimbang agar ukuran file < 1MB untuk WhatsApp
    const ffmpegCmd = `ffmpeg -y -i "${tmpIn}" -t 7 -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -vcodec libwebp -lossless 0 -compression_level 4 -q:v 45 -loop 0 -an -fs 850K "${tmpOut}"`;
    await execAsync(ffmpegCmd);

    const exifBuf = createExif(packname, author);
    await injectExif(tmpOut, exifBuf, tmpFinal);

    return await fs.promises.readFile(tmpFinal);
  } finally {
    try { await fs.promises.unlink(tmpIn); } catch {}
    try { await fs.promises.unlink(tmpOut); } catch {}
    try { await fs.promises.unlink(tmpFinal); } catch {}
  }
}

/**
 * Deteksi otomatis apakah media merupakan WebP (stiker bawaan)
 * @param {Buffer} buffer
 * @returns {boolean}
 */
function isWebpBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
  return buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP';
}

/**
 * Injeksi EXIF langsung ke file WebP yang sudah valid tanpa re-encoding ffmpeg
 * Menghindari error decoding animated webp dan menjaga kualitas asli
 * @param {Buffer} buffer
 * @param {string} packname
 * @param {string} author
 * @returns {Promise<Buffer>}
 */
async function webpToSticker(buffer, packname = config.botName, author = config.ownerName) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const tmpIn = path.join(os.tmpdir(), `webp_in_${id}.webp`);
  const tmpOut = path.join(os.tmpdir(), `webp_out_${id}.webp`);

  try {
    await fs.promises.writeFile(tmpIn, buffer);
    const exifBuf = createExif(packname, author);
    await injectExif(tmpIn, exifBuf, tmpOut);

    try {
      if (fs.existsSync(tmpOut)) {
        return await fs.promises.readFile(tmpOut);
      }
    } catch {}

    return buffer;
  } catch {
    return buffer;
  } finally {
    try { await fs.promises.unlink(tmpIn); } catch {}
    try { await fs.promises.unlink(tmpOut); } catch {}
  }
}

/**
 * Deteksi otomatis apakah media merupakan video / animasi
 * @param {Buffer} buffer
 * @returns {boolean}
 */
function isVideoBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8) return false;
  // MP4 / MOV header (ftyp at offset 4)
  if (buffer.slice(4, 8).toString() === 'ftyp') return true;
  // Matroska / WebM
  if (buffer.slice(0, 4).toString('hex') === '1a45dfa3') return true;
  // Animated GIF
  if (buffer.slice(0, 3).toString() === 'GIF') return true;
  return false;
}

/**
 * Fungsi utama pembuatan stiker
 * @param {Buffer} buffer
 * @param {object} options { packname, author, isVideo }
 * @returns {Promise<Buffer>}
 */
async function createSticker(buffer, options = {}) {
  const pack = options.packname || config.botName;
  const author = options.author || config.ownerName;

  // Jika buffer sudah berupa WebP (misal hasil ATTP), injeksikan metadata langsung
  if (isWebpBuffer(buffer)) {
    return await webpToSticker(buffer, pack, author);
  }

  const isVid = options.isVideo !== undefined ? options.isVideo : isVideoBuffer(buffer);

  if (isVid) {
    return await videoToSticker(buffer, pack, author);
  } else {
    return await imageToSticker(buffer, pack, author);
  }
}

module.exports = {
  createExif,
  imageToSticker,
  videoToSticker,
  webpToSticker,
  isWebpBuffer,
  isVideoBuffer,
  createSticker
};
