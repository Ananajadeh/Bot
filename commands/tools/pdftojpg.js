/**
 * Command: pdftojpg / pdf2jpg / pdfjpg
 * PDF To JPG - Konversi halaman PDF menjadi gambar JPG
 */

const { handlePdfCommand } = require('../../lib/pdfConverter');

module.exports = {
  name: 'pdftojpg',
  aliases: ['pdf2jpg', 'pdfjpg', 'pdf2jpeg', 'pdftojpeg'],
  category: 'tools',
  description: 'Konversi file PDF menjadi gambar JPG',
  usage: '[Kirim/balas file PDF]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async (ctx) => {
    return handlePdfCommand({
      ...ctx,
      format: 'jpg',
      label: 'Gambar JPG'
    });
  }
};
