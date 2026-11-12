/**
 * Command: pdftopptx / pdf2pptx / pdfppt
 * PDF To PPTX - Konversi dokumen PDF ke presentasi PowerPoint (.pptx)
 */

const { handlePdfCommand } = require('../../lib/pdfConverter');

module.exports = {
  name: 'pdftopptx',
  aliases: ['pdf2pptx', 'pdfppt', 'pdftoppt', 'pdfpowerpoint'],
  category: 'tools',
  description: 'Konversi file PDF menjadi presentasi PowerPoint (PPTX)',
  usage: '[Kirim/balas file PDF]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async (ctx) => {
    return handlePdfCommand({
      ...ctx,
      format: 'pptx',
      label: 'PowerPoint (PPTX)'
    });
  }
};
