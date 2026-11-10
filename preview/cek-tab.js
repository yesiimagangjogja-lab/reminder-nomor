const fs = require('fs');
let h = fs.readFileSync(__dirname + '/preview.html', 'utf8');
const w = process.argv[2] || '430';
const tab = process.argv[3] || 'nomor';
const probe = `<script>setTimeout(function(){gantiTab('${tab}');setTimeout(function(){document.title='TAB|tiles='+(document.getElementById('sehatTiles')||{textContent:'X'}).textContent.replace(/\\s+/g,' ').trim()+'|area='+document.getElementById('sehatArea').textContent.replace(/\\s+/g,' ').trim().slice(0,90);},2500);},1500);</script>`;
h = h.replace('</body>', probe + '</body>');
fs.writeFileSync(__dirname + '/_tab.html', h);
console.log('ok ' + w);
