const fs = require('fs');
let h = fs.readFileSync(__dirname + '/preview.html', 'utf8');
const probe = `<script>
setTimeout(function(){
  try{ gantiTab('nomor'); }catch(e){ document.title='ERR '+e.message; return; }
  setTimeout(function(){
    var out=[];
    var t0=performance.now();
    document.querySelector('#sehatListArea tbody .link').click();
    setTimeout(function(){
      var dm=document.getElementById('detailModal');
      out.push('detail='+Math.round(performance.now()-t0)+'ms shown='+dm.classList.contains('show')+' isi='+document.getElementById('detailBody').textContent.replace(/\\s+/g,' ').trim().slice(0,120));
      bootstrap.Modal.getInstance(dm).hide();
      setTimeout(function(){
        var t1=performance.now();
        document.querySelector('#sehatListArea [onclick^="bukaCatat"]').click();
        setTimeout(function(){
          var cm=document.getElementById('catatModal');
          out.push('catat='+Math.round(performance.now()-t1)+'ms shown='+cm.classList.contains('show')+' tgl='+document.getElementById('d_tglBaru').value+' no='+document.getElementById('catatNomor').textContent);
          document.title='MEAS|'+out.join(' || ');
        },350);
      },450);
    },120);
  },700);
},2200);
</script>`;
h = h.replace('</body>', probe + '</body>');
fs.writeFileSync(__dirname + '/_p.html', h);
console.log('ok');
