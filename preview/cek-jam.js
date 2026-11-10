const fs = require('fs');
let h = fs.readFileSync(__dirname + '/preview.html', 'utf8');
const probe = `<script>
setTimeout(function(){
  var a=document.getElementById('jamHidup').textContent;
  setTimeout(function(){
    var b=document.getElementById('jamHidup').textContent;
    var bar=document.querySelector('.appclock').getBoundingClientRect();
    document.title='MEAS|'+a+' -> '+b+'|berubah='+(a!==b)+'|lebar='+Math.round(bar.width)+'|scroll='+(document.documentElement.scrollWidth-document.documentElement.clientWidth);
  },1300);
},2000);
</script>`;
h = h.replace('</body>', probe + '</body>');
fs.writeFileSync(__dirname + '/_p.html', h);
console.log('ok');
