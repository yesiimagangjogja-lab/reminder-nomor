const fs = require('fs');
const idx = fs.readFileSync('D:/reminder_nomor/yesi/index.html', 'utf8');
const app = fs.readFileSync('D:/reminder_nomor/yesi/app.html', 'utf8');

// 1. handler dari atribut on* di index.html harus punya function di app.html
const handlers = [...idx.matchAll(/on(?:click|change|submit|input)="([a-zA-Z_][a-zA-Z0-9_]*)\(/g)].map(m => m[1]);
[...new Set(handlers)].forEach(fn => {
  const ada = app.indexOf('function ' + fn + '(') !== -1 || app.indexOf('function ' + fn + ' (') !== -1;
  if (!ada) { console.log('FUNGSI HILANG: ' + fn); }
});
console.log('handler dicek: ' + [...new Set(handlers)].length);

// 2. id yang dipakai getElementById di app.html — laporkan yang tak ada di index.html
const ids = [...app.matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1]);
const hilang = [...new Set(ids)].filter(id => !idx.includes('id="' + id + '"'));
console.log('ID tak ada di index.html: ' + (hilang.length ? hilang.join(', ') : '(semua ada / hanya diriwayat mati)'));
