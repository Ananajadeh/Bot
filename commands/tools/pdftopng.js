/**
 * Command: pdftopng / pdf2png / pdfpng
 * PDF To PNG - Konversi halaman PDF menjadi gambar PNG kualitas tinggi
 */

const { handlePdfCommand } = require('../../lib/pdfConverter');

module.exports = {
  name: 'pdftopng',
  aliases: ['pdf2png', 'pdfpng'],
  category: 'tools',
  description: 'Konversi file PDF menjadi gambar PNG kualitas tinggi',
  usage: '[Kirim/balas file PDF]',
  groupOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  ownerOnly: false,

  execute: async (ctx) => {
    return handlePdfCommand({
      ...ctx,
      format: 'png',
      label: 'Gambar PNG'
    });
  }
};
