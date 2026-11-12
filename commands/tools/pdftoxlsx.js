/**
 * Command: pdftoxlsx / pdftoxslx / pdf2xlsx / pdfexcel
 * PDF To XLSX (XSLX) - Konversi dokumen PDF ke tabel spreadsheet Excel (.xlsx)
 */

const { handlePdfCommand } = require('../../lib/pdfConverter');

module.exports = {
  name: 'pdftoxlsx',
  aliases: ['pdftoxslx', 'pdf2xlsx', 'pdf2xslx', 'pdfexcel', 'pdf2excel'],
  category: 'tools',
  description: 'Konversi file PDF menjadi spreadsheet Excel (XLSX)',
  usage: '[Kirim/balas file PDF]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async (ctx) => {
    return handlePdfCommand({
      ...ctx,
      format: 'xlsx',
      label: 'Excel Spreadsheet (XLSX)'
    });
  }
};
