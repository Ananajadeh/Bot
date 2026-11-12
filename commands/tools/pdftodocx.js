/**
 * Command: pdftodocx / pdf2docx / pdfword
 * PDF To DOCX - Konversi dokumen PDF ke Microsoft Word (.docx)
 */

const { handlePdfCommand } = require('../../lib/pdfConverter');

module.exports = {
  name: 'pdftodocx',
  aliases: ['pdf2docx', 'pdfword', 'pdftoword'],
  category: 'tools',
  description: 'Konversi file PDF menjadi dokumen Word (DOCX)',
  usage: '[Kirim/balas file PDF]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async (ctx) => {
    return handlePdfCommand({
      ...ctx,
      format: 'docx',
      label: 'Microsoft Word (DOCX)'
    });
  }
};
