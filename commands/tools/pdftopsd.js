/**
 * Command: pdftopsd / pdf2psd / pdfpsd
 * PDF To PSD - Konversi dokumen PDF ke format Adobe Photoshop (.psd)
 */

const { handlePdfCommand } = require('../../lib/pdfConverter');

module.exports = {
  name: 'pdftopsd',
  aliases: ['pdf2psd', 'pdfpsd', 'pdfphotoshop'],
  category: 'tools',
  description: 'Konversi file PDF menjadi Adobe Photoshop (PSD)',
  usage: '[Kirim/balas file PDF]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async (ctx) => {
    return handlePdfCommand({
      ...ctx,
      format: 'psd',
      label: 'Adobe Photoshop (PSD)'
    });
  }
};
