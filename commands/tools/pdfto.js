/**
 * Command: pdfto / pdfconvert / konversipdf
 * PDF All-in-One Converter - Mengonversi PDF ke format yang diinginkan
 * Format yang didukung: docx, pptx, xlsx (xslx), psd, jpg, png, text
 */

const { handlePdfCommand } = require('../../lib/pdfConverter');
const config = require('../../config');

const SUPPORTED_FORMATS = {
  docx: 'Microsoft Word (DOCX)',
  doc: 'Microsoft Word (DOCX)',
  word: 'Microsoft Word (DOCX)',
  pptx: 'PowerPoint (PPTX)',
  ppt: 'PowerPoint (PPTX)',
  xlsx: 'Excel Spreadsheet (XLSX)',
  xslx: 'Excel Spreadsheet (XLSX)',
  xls: 'Excel Spreadsheet (XLSX)',
  excel: 'Excel Spreadsheet (XLSX)',
  psd: 'Adobe Photoshop (PSD)',
  jpg: 'Gambar JPG',
  jpeg: 'Gambar JPG',
  png: 'Gambar PNG',
  text: 'Teks (TXT)',
  txt: 'Teks (TXT)'
};

module.exports = {
  name: 'pdfto',
  aliases: ['pdfconvert', 'konversipdf', 'pdf2'],
  category: 'tools',
  description: 'Konversi file PDF ke DOCX, PPTX, XLSX, PSD, JPG, PNG, atau Teks',
  usage: '<format> [Kirim/balas file PDF]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async (ctx) => {
    const { args, m, command } = ctx;
    const requestedFormat = (args[0] || '').toLowerCase().trim();

    if (!requestedFormat || !SUPPORTED_FORMATS[requestedFormat]) {
      return m.reply(
        `📌 *PANDUAN KONVERSI PDF*\n\n` +
        `Kirim atau balas file PDF dengan perintah:\n` +
        `\`${config.prefix}${command} <format>\`\n\n` +
        `*Pilihan Format yang Didukung:*\n` +
        `◦ \`docx\` : Word Document (.docx)\n` +
        `◦ \`pptx\` : PowerPoint (.pptx)\n` +
        `◦ \`xlsx\` : Excel Spreadsheet (.xlsx)\n` +
        `◦ \`psd\`  : Adobe Photoshop (.psd)\n` +
        `◦ \`jpg\`  : Gambar JPG\n` +
        `◦ \`png\`  : Gambar PNG\n` +
        `◦ \`text\` : Ekstraksi Teks Bersih (.txt)\n\n` +
        `*Contoh:* Balas file PDF lalu ketik \`${config.prefix}${command} docx\``
      );
    }

    let target = requestedFormat;
    if (['doc', 'word'].includes(target)) target = 'docx';
    if (target === 'ppt') target = 'pptx';
    if (['xls', 'excel', 'xslx'].includes(target)) target = 'xlsx';
    if (target === 'jpeg') target = 'jpg';
    if (target === 'txt') target = 'text';

    return handlePdfCommand({
      ...ctx,
      format: target,
      label: SUPPORTED_FORMATS[requestedFormat]
    });
  }
};
