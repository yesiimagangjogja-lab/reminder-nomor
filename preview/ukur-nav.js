const fs = require('fs');
let h = fs.readFileSync(__dirname + '/preview.html', 'utf8');
const probe = "<script>setTimeout(function(){var b=document.getElementById('ticker');var r=b.getBoundingClientRect();document.title='MEAS|nav=' + Math.round(r.height) + 'px chip=' + Math.round(document.querySelector('.tk-chip').getBoundingClientRect().height) + ' wid=' + document.documentElement.clientWidth + ' scroll=' + document.documentElement.scrollWidth;},2500)</script>";
h = h.replace('</body>', probe + '</body>');
fs.writeFileSync(__dirname + '/_m.html', h);
console.log('ok');
