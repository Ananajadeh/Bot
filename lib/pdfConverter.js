/**
 * Helper PDF Converter
 * Mendukung konversi PDF ke berbagai format:
 * - DOCX (Word)
 * - PPTX (PowerPoint)
 * - XLSX / XSLX (Excel)
 * - PSD (Adobe Photoshop)
 * - JPG / JPEG (Gambar)
 * - PNG (Gambar)
 * - Text / TXT (Ekstraksi teks bersih)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const axios = require('axios');
const neoxr = require('./neoxr');

// Deteksi binary Python
const PYTHON_BIN = fs.existsSync('/data/data/com.termux/files/usr/bin/python')
  ? '/data/data/com.termux/files/usr/bin/python'
  : (fs.existsSync('/usr/bin/python3') ? '/usr/bin/python3' : 'python3');

const MIMETYPES = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xslx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  psd: 'image/vnd.adobe.photoshop',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  txt: 'text/plain',
  zip: 'application/zip'
};

/**
 * Ekstraksi teks dari PDF menggunakan Python pypdf
 * @param {Buffer} pdfBuffer
 * @param {string} baseName
 */
async function pdfToText(pdfBuffer, baseName = 'document') {
  const tmpId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const tmpPdf = path.join(os.tmpdir(), `pdf_${tmpId}.pdf`);
  const tmpTxt = path.join(os.tmpdir(), `txt_${tmpId}.txt`);

  try {
    await fs.promises.writeFile(tmpPdf, pdfBuffer);

    const script = `
import pypdf, sys

try:
    reader = pypdf.PdfReader("${tmpPdf}")
    extracted = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ''
        extracted.append(f"--- [ Halaman {i + 1} ] ---\\n" + text.strip())
    
    full_text = "\\n\\n".join(extracted)
    with open("${tmpTxt}", "w", encoding="utf-8") as f:
        f.write(full_text)
except Exception as e:
    sys.stderr.write(str(e))
    sys.exit(1)
`;

    await execAsync(`${PYTHON_BIN} -c '${script.replace(/'/g, "'\\''")}'`);
    const text = await fs.promises.readFile(tmpTxt, 'utf-8');
    const buffer = Buffer.from(text, 'utf-8');

    return {
      text,
      buffer,
      filename: `${baseName}.txt`,
      mimetype: MIMETYPES.txt,
      isImage: false
    };
  } finally {
    try { await fs.promises.unlink(tmpPdf); } catch {}
    try { await fs.promises.unlink(tmpTxt); } catch {}
  }
}

/**
 * Ekstraksi PDF ke Spreadsheet Excel (XLSX) menggunakan Python openpyxl
 * @param {Buffer} pdfBuffer
 * @param {string} baseName
 */
async function pdfToXlsxLocal(pdfBuffer, baseName = 'document') {
  const tmpId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const tmpPdf = path.join(os.tmpdir(), `pdf_${tmpId}.pdf`);
  const tmpXlsx = path.join(os.tmpdir(), `xlsx_${tmpId}.xlsx`);

  try {
    await fs.promises.writeFile(tmpPdf, pdfBuffer);

    const script = `
import pypdf, openpyxl, sys

try:
    reader = pypdf.PdfReader("${tmpPdf}")
    wb = openpyxl.Workbook()
    # Hapus sheet default kosong
    ws = wb.active
    ws.title = "PDF Data"

    ws.append(["Halaman", "Baris", "Isi Teks"])

    for page_idx, page in enumerate(reader.pages):
        text = page.extract_text() or ''
        lines = [line.strip() for line in text.split('\\n') if line.strip()]
        for line_idx, line in enumerate(lines):
            # Coba pisahkan jika baris berupa pemisah kolom (tab atau spasi ganda)
            ws.append([page_idx + 1, line_idx + 1, line])

    wb.save("${tmpXlsx}")
except Exception as e:
    sys.stderr.write(str(e))
    sys.exit(1)
`;

    await execAsync(`${PYTHON_BIN} -c '${script.replace(/'/g, "'\\''")}'`);
    const buffer = await fs.promises.readFile(tmpXlsx);

    return {
      buffer,
      filename: `${baseName}.xlsx`,
      mimetype: MIMETYPES.xlsx,
      isImage: false
    };
  } finally {
    try { await fs.promises.unlink(tmpPdf); } catch {}
    try { await fs.promises.unlink(tmpXlsx); } catch {}
  }
}

/**
 * Konversi PDF via API Neoxr
 * Mendukung DOCX, PPTX, PSD, JPG, PNG, XSLX
 * @param {Buffer} pdfBuffer
 * @param {string} targetFormat
 * @param {string} originalName
 */
async function pdfToNeoxr(pdfBuffer, targetFormat, originalName = 'document.pdf') {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const format = targetFormat.toLowerCase();

  // 1. Unggah PDF ke CDN Neoxr
  const fileUrl = await neoxr.uploadFile(pdfBuffer, `${baseName}.pdf`, 'application/pdf');

  // 2. Minta konversi dari API Neoxr
  const res = await neoxr.pdfConvert(fileUrl, `${baseName}.pdf`, format);

  if (!res || !res.status || !res.data || !res.data.url) {
    throw new Error(res?.msg || `Gagal mengonversi PDF ke ${format.toUpperCase()}`);
  }

  const resultUrl = res.data.url;
  const resultFilename = res.data.filename || `${baseName}.${format}`;

  // 3. Unduh hasil konversi
  const fileRes = await axios.get(resultUrl, {
    responseType: 'arraybuffer',
    timeout: 120000
  });
  const fileBuffer = Buffer.from(fileRes.data);

  // Jika hasilnya adalah file ZIP (misal untuk JPG, PNG, atau PSD multi-halaman)
  if (resultFilename.endsWith('.zip')) {
    const tmpId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tmpZip = path.join(os.tmpdir(), `zip_${tmpId}.zip`);

    try {
      await fs.promises.writeFile(tmpZip, fileBuffer);

      // Periksa isi zip menggunakan python
      const checkScript = `
import zipfile, json, os

z = zipfile.ZipFile("${tmpZip}")
names = z.namelist()
single_file = names[0] if len(names) == 1 else None
single_data = ""
if single_file:
    with open("${tmpZip}_out", "wb") as f:
        f.write(z.read(single_file))
print(json.dumps({"count": len(names), "names": names, "single": single_file}))
`;

      const { stdout } = await execAsync(`${PYTHON_BIN} -c '${checkScript.replace(/'/g, "'\\''")}'`);
      const info = JSON.parse(stdout.trim() || '{}');

      // Jika zip hanya berisi 1 halaman/file (contoh: Page1.jpg, Page1.png, Page1.psd)
      if (info.count === 1 && info.single) {
        const extractedBuffer = await fs.promises.readFile(`${tmpZip}_out`);
        try { await fs.promises.unlink(`${tmpZip}_out`); } catch {}

        const ext = path.extname(info.single).slice(1).toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png'].includes(ext);

        return {
          buffer: extractedBuffer,
          filename: `${baseName}.${ext}`,
          mimetype: MIMETYPES[ext] || 'application/octet-stream',
          isImage,
          isSingle: true
        };
      }
    } catch {} finally {
      try { await fs.promises.unlink(tmpZip); } catch {}
    }

    // Jika lebih dari 1 file, kembalikan sebagai file ZIP
    return {
      buffer: fileBuffer,
      filename: resultFilename,
      mimetype: MIMETYPES.zip,
      isImage: false,
      isZip: true
    };
  }

  const ext = path.extname(resultFilename).slice(1).toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png'].includes(ext);

  return {
    buffer: fileBuffer,
    filename: resultFilename,
    mimetype: MIMETYPES[ext] || 'application/octet-stream',
    isImage
  };
}

/**
 * Fungsi Utama Konversi PDF serbaguna
 * @param {Buffer} pdfBuffer
 * @param {string} targetFormat
 * @param {string} originalName
 */
async function convertPdf(pdfBuffer, targetFormat, originalName = 'document.pdf') {
  const normFormat = targetFormat.toLowerCase().trim();
  const baseName = (originalName || 'document').replace(/\.[^/.]+$/, '');

  // Ekstraksi Teks
  if (['text', 'txt'].includes(normFormat)) {
    return await pdfToText(pdfBuffer, baseName);
  }

  // Konversi Excel (XLSX / XSLX)
  if (['xlsx', 'xslx', 'xls'].includes(normFormat)) {
    try {
      // Coba lewat Neoxr API terlebih dahulu
      return await pdfToNeoxr(pdfBuffer, 'xslx', originalName);
    } catch {
      // Fallback lokal jika Neoxr API gagal
      return await pdfToXlsxLocal(pdfBuffer, baseName);
    }
  }

  // Format Neoxr lainnya: DOCX, PPTX, PSD, JPG, PNG
  return await pdfToNeoxr(pdfBuffer, normFormat, originalName);
}

const config = require('../config');
const { error } = require('./color');

/**
 * Handler umum untuk perintah-perintah konversi PDF
 */
async function handlePdfCommand({ sock, m, format, command, label }) {
  const isQuotedDoc = m.quoted && (m.quoted.type === 'documentMessage' || m.quoted.isMedia);
  const isDirectDoc = m.type === 'documentMessage';

  if (!isQuotedDoc && !isDirectDoc) {
    return m.reply(
      `⚠️ Silakan kirim file PDF dengan caption \`${config.prefix}${command}\` atau balas file PDF yang sudah dikirim!\n\n` +
      `📌 *Target:* Konversi ke ${label || format.toUpperCase()}`
    );
  }

  const originalName =
    m.quoted?.message?.documentMessage?.fileName ||
    m.message?.documentMessage?.fileName ||
    'document.pdf';

  const mime =
    m.quoted?.message?.documentMessage?.mimetype ||
    m.message?.documentMessage?.mimetype ||
    '';

  if (!originalName.toLowerCase().endsWith('.pdf') && !mime.includes('pdf')) {
    return m.reply('⚠️ File yang dikirim harus berformat *PDF* (.pdf)!');
  }

  await m.react('⏳');

  try {
    const pdfBuffer = await m.download();
    if (!pdfBuffer || pdfBuffer.length === 0) {
      await m.react('❌');
      return m.reply('❌ Gagal mengunduh file PDF. Silakan coba kirim ulang.');
    }

    const res = await convertPdf(pdfBuffer, format, originalName);

    // Jika format teks & teksnya pendek (< 1500 karakter), kirim teksnya langsung
    if (format === 'text' || format === 'txt') {
      if (res.text && res.text.length <= 1500) {
        await m.reply(`📄 *HASIL EKSTRAKSI TEKS PDF:*\n\n${res.text}`);
        await m.react('✅');
        return;
      }
    }

    // Jika berupa gambar tunggal (misal JPG / PNG 1 halaman)
    if (res.isImage && res.buffer) {
      await sock.sendMessage(
        m.chat,
        {
          image: res.buffer,
          caption: `✅ *KONVERSI PDF BERHASIL*\n\n` +
            `◦ *File Asal :* ${originalName}\n` +
            `◦ *Format    :* ${label || format.toUpperCase()}\n` +
            `◦ *Nama File :* ${res.filename}\n\n` +
            `_${config.footer}_`
        },
        { quoted: m }
      );
      await m.react('✅');
      return;
    }

    // Kirim sebagai dokumen
    await sock.sendMessage(
      m.chat,
      {
        document: res.buffer,
        fileName: res.filename,
        mimetype: res.mimetype,
        caption: `✅ *KONVERSI PDF BERHASIL*\n\n` +
          `◦ *File Asal :* ${originalName}\n` +
          `◦ *Format    :* ${label || format.toUpperCase()}\n` +
          `◦ *Nama File :* ${res.filename}\n\n` +
          `_${config.footer}_`
      },
      { quoted: m }
    );

    await m.react('✅');
  } catch (err) {
    error(`[PDF CONVERT ERROR] ${err.stack || err.message}`);
    await m.react('❌');
    return m.reply(`❌ Gagal mengonversi file PDF: ${err.message}`);
  }
}

module.exports = {
  convertPdf,
  pdfToText,
  pdfToXlsxLocal,
  pdfToNeoxr,
  handlePdfCommand,
  MIMETYPES
};
