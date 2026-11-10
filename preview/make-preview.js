// Hasilkan preview.html: tampilan dashboard pakai data contoh, tanpa menyentuh versi live.
// Jalankan: node D:/reminder_nomor/preview/make-preview.js
var fs = require('fs');
var path = require('path');
var root = path.join(__dirname, '..', 'yesi');

function baca(nama) { return fs.readFileSync(path.join(root, nama), 'utf8'); }

var html = baca('index.html');
var styles = baca('styles.html');
var app = baca('app.html');
var mock = fs.readFileSync(path.join(__dirname, 'mock.js'), 'utf8');
var shim = fs.readFileSync(path.join(__dirname, 'shim.js'), 'utf8');

var banner = '<div style="background:#FEF3C7;border:1px solid #FCD34D;color:#92400E;padding:9px 14px;' +
  'border-radius:10px;margin:0 0 14px;font-size:.8rem;font-weight:600">' +
  'PREVIEW LOKAL &mdash; bentuk tampilan dengan data contoh. Versi yang kamu pakai belum diubah.</div>';

var out = html
  .replace("<?!= include('styles'); ?>", styles)
  .replace("<?!= include('app'); ?>", '<script>\n' + mock + '\n' + shim + '\n</script>\n' + app)
  .replace('<div class="wrap">', '<div class="wrap">\n' + banner)
  .replace('<base target="_top">', '');

fs.writeFileSync(path.join(__dirname, 'preview.html'), out);
console.log('preview.html siap: ' + Math.round(out.length / 1024) + ' KB');
