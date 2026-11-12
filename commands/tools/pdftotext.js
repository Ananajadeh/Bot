/**
 * Command: pdftotext / pdf2text / pdf2txt / pdftxt
 * PDF To Text - Ekstraksi teks lengkap dari dokumen PDF
 */

const { handlePdfCommand } = require('../../lib/pdfConverter');

module.exports = {
  name: 'pdftotext',
  aliases: ['pdf2text', 'pdf2txt', 'pdftxt', 'pdfteks', 'pdftotxt'],
  category: 'tools',
  description: 'Ekstraksi isi teks lengkap dari file PDF',
  usage: '[Kirim/balas file PDF]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async (ctx) => {
    return handlePdfCommand({
      ...ctx,
      format: 'text',
      label: 'Teks (TXT)'
    });
  }
};
