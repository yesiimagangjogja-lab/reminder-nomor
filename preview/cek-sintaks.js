// Cek sintaks: script bodies di app.html, index.html; brace balance styles.html; doGet HTML build.
const fs = require('fs');
const path = require('path');
const DIR = 'D:/reminder_nomor/yesi';
let gagal = 0;

function cekJs(nama, isi) {
  try {
    new Function(isi);
    console.log('OK   ' + nama);
  } catch (e) {
    gagal++;
    console.log('GAGAL ' + nama + ' -> ' + e.message);
  }
}

// code.js = murni JS
cekJs('code.js', fs.readFileSync(path.join(DIR, 'code.js'), 'utf8'));

// app.html = blok <script> murni; index.html markup (cek jejak saja, bukan sintaks)
const appRaw = fs.readFileSync(path.join(DIR, 'app.html'), 'utf8');
const appJs = appRaw.replace(/<script[^>]*>/gi, '').replace(/<\/script>/gi, '');
cekJs('app.html (script)', appJs);

// balance kurung kurawal styles.html
const css = fs.readFileSync(path.join(DIR, 'styles.html'), 'utf8');
const buka = (css.match(/\{/g) || []).length;
const tutup = (css.match(/\}/g) || []).length;
console.log('CSS braces: ' + buka + ' buka / ' + tutup + ' tutup' + (buka === tutup ? ' (seimbang)' : ' (TIDAK SEIMBANG!)'));
if (buka !== tutup) gagal++;

// pastikan sisa jejak jadwal/riwayat/chat sudah hilang dari markup & logic aktif
const app = fs.readFileSync(path.join(DIR, 'app.html'), 'utf8');
const idx = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const gantiTabRefs = app.match(/gantiTab\('([a-z]+)'\)/g) || [];
console.log('gantiTab refs: ' + gantiTabRefs.join(', '));
['tab-jadwal', 'tab-riwayat', 'tab-chat', 'tab-chatwa', 'Jalankan Reminder', 'Chat WA', 'Riwayat WA'].forEach(function (s) {
  const ada = idx.indexOf(s) !== -1;
  console.log((ada ? 'ADA!! ' : 'bersih ') + '"' + s + '" di index.html');
  if (ada) gagal++;
});

process.exit(gagal ? 1 : 0);
