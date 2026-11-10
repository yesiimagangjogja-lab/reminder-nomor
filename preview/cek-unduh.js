const fs = require('fs');
let h = fs.readFileSync(__dirname + '/preview.html', 'utf8');
const probe = `<script>
HTMLAnchorElement.prototype.click=function(){window.__UNDUH=this.download;};
setTimeout(function(){
  var out=[];
  try{
    unduhExcel(null);
    setTimeout(function(){
      out.push('file='+(window.__UNDUH||'TIDAK'));
      out.push('alert='+(document.getElementById('alertBox')||{textContent:'X'}).textContent.replace(/\\s+/g,' ').trim().slice(0,44));
      document.title='MEAS|'+out.join(' | ');
    },600);
  }catch(e){ document.title='ERR|'+e.message; }
},2000);
</script>`;
h = h.replace('</body>', probe + '</body>');
fs.writeFileSync(__dirname + '/_p.html', h);
console.log('ok');
