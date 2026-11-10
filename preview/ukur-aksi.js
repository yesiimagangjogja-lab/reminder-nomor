const fs = require('fs');
let h = fs.readFileSync(__dirname + '/preview.html', 'utf8');
const probe = `<script>
setTimeout(function(){
  try{ gantiTab('nomor'); }catch(e){ document.title='ERR '+e.message; return; }
  setTimeout(function(){
    var out=[];
    var th=document.querySelector('.tbl-lengkap th.th-aksi');
    var td=document.querySelectorAll('.tbl-lengkap td.td-aksi')[0];
    var b=td.querySelector('.btn');
    var rTh=th.getBoundingClientRect(), rTd=td.getBoundingClientRect(), rB=b.getBoundingClientRect();
    var gp=td.querySelector('.aksi-gp').getBoundingClientRect();
    out.push('btn='+Math.round(rB.height)+'x'+Math.round(rB.width));
    out.push('gp='+Math.round(gp.width)+' td='+Math.round(rTd.width)+' th='+Math.round(rTh.width));
    out.push('selisihTengah='+(Math.abs((rTh.left+rTh.width/2)-(gp.left+gp.width/2)).toFixed(1)));
    var potong=[];
    document.querySelectorAll('.tbl-lengkap th, .tbl-lengkap td').forEach(function(c,i){ if(c.scrollWidth>c.clientWidth+1) potong.push(i+':'+c.textContent.trim().slice(0,10)); });
    out.push('potong='+(potong.length?potong.slice(0,4).join(','):'tidak'));
    var sc=document.querySelector('.tbl-scroll');
    out.push('scrollTabel='+(sc.scrollWidth-sc.clientWidth));
    document.title='MEAS|'+out.join(' | ');
  },800);
},2200);
</script>`;
h = h.replace('</body>', probe + '</body>');
fs.writeFileSync(__dirname + '/_p.html', h);
console.log('ok');
