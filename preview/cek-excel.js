const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(__dirname + '/mock.js', 'utf8') + '\n' +
  fs.readFileSync(__dirname + '/shim.js', 'utf8') + '\n;API';
const API = vm.runInNewContext(src, { console: console, document: { getElementById: function () { return null; } }, localStorage: { getItem: function () { return null; }, setItem: function () {} } });
const d = API.exportCsv();
fs.writeFileSync(__dirname + '/contoh-rekap-excel.csv', d.isi, 'utf8');

function parse(text) {
  var rows = [], row = [], cell = '', q = false, i;
  for (i = 0; i < text.length; i++) {
    var c = text[i];
    if (c === '"') { if (q && text[i + 1] === '"') { cell += '"'; i++; } else q = !q; }
    else if (c === ';' && !q) { row.push(cell); cell = ''; }
    else if ((c === '\n' || c === '\r') && !q) {
      if (cell !== '' || row.length) { row.push(cell); rows.push(row); row = []; cell = ''; }
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

var bersih = d.isi.replace(/^﻿/, '').split('\r\n');
console.log('nama file :', d.nama);
console.log('baris 1   :', bersih[0]);
var rows = parse(bersih.slice(1).join('\n'));
var salah = [];
rows.forEach(function (r, i) { if (r.length !== 8) salah.push((i + 2) + ' kolom=' + r.length); });
console.log('jumlah baris data :', rows.length, '| kolom tidak rata:', salah.length ? salah.slice(0, 3).join(', ') : 'tidak ada');
console.log('contoh baris 2    :', JSON.stringify(rows[1]).slice(0, 150));
var nolHilang = rows.filter(function (r) { return /^="0/.test(r[0]); }).length;
console.log('nomor yang nol depannya aman :', nolHilang, 'dari', rows.length);
