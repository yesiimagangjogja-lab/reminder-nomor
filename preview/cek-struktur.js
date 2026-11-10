// Cek cepat struktur HTML: kedalaman div + di dalam tab mana elemen tertentu berada.
var fs = require('fs');
var h = fs.readFileSync(process.argv[2] || 'D:/reminder_nomor/yesi/index.html', 'utf8');
var re = /<div\b[^>]*>|<\/div>/g, m, depth = 0, stack = [], bad = [];
var want = ['bulkBar', 'hangusArea', 'sehatArea', 'listArea', 'sehatListArea', 'pengingatArea'];
var found = {};
while ((m = re.exec(h))) {
  if (m[0][1] === '/') {
    depth--; stack.pop();
    if (depth < 0) bad.push('tutup berlebih di indeks ' + m.index);
  } else {
    var idm = m[0].match(/id="([^"]+)"/);
    var tab = stack.filter(function(t){ return /^tab-/.test(t); });
    if (idm && want.indexOf(idm[1]) >= 0) found[idm[1]] = tab.length ? tab[tab.length - 1] : '(di luar tab)';
    depth++; stack.push(idm ? idm[1] : 'div');
  }
}
console.log('kedalaman div akhir:', depth, bad.length ? '| MASALAH: ' + bad[0] : '| seimbang');
Object.keys(found).forEach(function(k) { console.log('  #' + k + ' ada di dalam ' + found[k]); });
