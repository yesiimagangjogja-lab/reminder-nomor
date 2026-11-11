function isiData() {
  var sh = sheetNomor();
  var n = sh.getLastRow();
  if (n > 1) sh.deleteRows(2, n - 1);
  var SEED = [[1,"082129900060","Telkomsel","2020-06-02","Vantri (Admin) [Ruangan Pak Danny]"],[2,"082218888050","Telkomsel","2020-06-02","Vantri (Admin) [Ruangan Pak Danny]"],[3,"082243394877","Telkomsel","2020-06-02","Vantri [Ruangan Pak Danny]"],[4,"082266121202","Telkomsel","2020-06-02","Vantri [Ruangan Pak Danny]"],[5,"087738134186","XL","2020-08-29","CS WIKA (Lelly_8_8)"],[6,"083840745472","Axis","2020-09-25","Vantri (Lelly_8_3) [Ruangan Pak Danny]"],[7,"087738134180","XL","2020-09-29","CS Rari (Dwi_5_4)"],[8,"087738134181","XL","2020-09-29","DIMATIKAN"],[9,"083145731821","Axis","2020-10-17","Vantri (Fara_6_4) [Ruangan Pak Danny]"],[10,"083837094588","Axis","2020-10-24","Vantri (Fara_6_4) [Ruangan Pak Danny]"],[11,"083840745611","Axis","2020-10-29","CS ALDA (Nisa_4_1)"],[12,"083840745598","Axis","2020-11-14","CS ALDA (Nisa_4_4)"],[13,"082243210102","Telkomsel","2020-12-23","Diambil Pak Danny"],[14,"082281111808","Telkomsel","2021-01-01","Anak Magang HR"],[15,"087718879574","XL","2021-01-01","Vantri (Fara_6_6) [Ruangan Pak Danny]"],[16,"081271916931","Telkomsel","2021-02-21","SUDAH DIAMBIL PAK DANY LAGI"],[17,"083842136910","Axis","2021-03-27","Vantri [Ruangan Pak Danny]"],[18,"083842136940","Axis","2021-03-27","Vantri [Ruangan Pak Danny]"],[19,"083840745533","Axis","2021-07-31","CS ALDA (Nisa_6_6)"],[20,"087872023264","XL","2021-12-30","Diambil Pak Nans"],[21,"0895336340135","Three","2022-11-04","Belum tau"],[22,"089514034864","Three","2024-05-19","(Sterofoam) Ruangan Pak Danny"],[23,"089514036413","Three","2024-05-19","(Sterofoam) Ruangan Pak Danny"],[24,"08995138693","Three","2025-05-26","CS ALDA (Nisa_6_4)"],[25,"089524099919","Three","2025-06-06","Vantri [Ruangan Pak Danny]"],[26,"083145731883","Axis","2025-06-25","Vantri (Pak Danny) [Ruangan Pak Danny]"],[27,"089514013119","Three","2026-05-13","Di dompet orange/ kuning"],[28,"089514013120","Three","2026-05-13",""],[29,"089514013125","Three","2026-05-13",""],[30,"089514013128","Three","2026-05-13",""],[31,"089513973072","Three","2026-05-15","(Sterofoam) Ruangan Pak Danny"],[32,"0895403170401","Three","2026-06-27",""],[33,"082242527197","Telkomsel","2026-07-08","CS Rari (Dwi_5_3)"],[34,"085885635736","Indosat","2026-07-14","CS ALDA (Nisa_6_2)"],[35,"085868025250","Indosat","2026-07-18","CS LILI"],[36,"088802806310","Smartfren","2026-08-01",""],[37,"089633040400","Three","2026-08-02","CS Rari"],[38,"087738134190","XL","2026-08-14",""],[39,"089522199922","Three","2026-10-02","HR - Dita"],[40,"08985366720","Three","2026-10-08","(Sterofoam) Ruangan Pak Danny"],[41,"083842135756","Axis","2026-10-25",""],[42,"083842136900","Axis","2026-10-25","CS BAYU"],[43,"0895336340125","Three","2026-11-01",""],[44,"089633066266","Three","2026-11-07","CS ALDA (Nisa_6_1)"],[45,"089524099993","Three","2026-11-09",""],[46,"0816666207","Indosat","2026-11-11","HRD Ai & Kode (Pandu_3_1)"],[47,"085743333708","Indosat","2026-11-12","CS ALDA (Nisa_4_3)"],[48,"0895321075551","Three","2026-11-15","ACC Rifka"],[49,"083145945883","Axis","2026-11-25","CS FITRI (Dwi_5_5)"],[50,"083842137000","Axis","2026-11-27",""],[51,"08979170070","Three","2027-01-07",""],[52,"089514031948","Three","2027-01-26",""],[53,"089514032492","Three","2027-01-26","(Sterofoam) Ruangan Pak Danny"],[54,"089514012304","Three","2027-01-31",""],[55,"089514032095","Three","2027-02-01","(Sterofoam) Ruangan Pak Danny"],[56,"089514034710","Three","2027-02-03",""],[57,"089514012258","Three","2027-02-06","(Sterofoam) Ruangan Pak Danny"],[58,"085878995686","Indosat","2027-02-09",""],[59,"089615814851","Three","2027-02-10","CS ALDA (Nisa_6_5)"],[60,"085869047132","Indosat","2027-02-12",""],[61,"0895403150904","Three","2027-02-20","2000.0"],[62,"0895403160709","Three","2027-02-20",""],[63,"0895403173939","Three","2027-02-22","Ai (HRD)"],[64,"0895403176100","Three","2027-02-24","Vantri (Fara_6_5) [Ruangan Pak Danny]"],[65,"0895403173737","Three","2027-02-27",""],[66,"0895403172277","Three","2027-02-28",""],[67,"0895403174433","Three","2027-02-28",""],[68,"08979170060","Three","2027-03-04",""],[69,"0895336340120","Three","2027-03-06",""],[70,"0895403173100","Three","2027-03-06","Tim HR MJ"],[71,"08974324163","Three","2027-03-06","(Sterofoam) Ruangan Pak Danny"],[72,"089677377301","Three","2027-03-09",""],[73,"0895336340117","Three","2027-03-18","CS WIKA (Lelly_8_6)"],[74,"0895403173838","Three","2027-03-23",""],[75,"089515303281","Three","2027-03-25","(Sterofoam) Ruangan Pak Danny"],[76,"0895343016267","Three","2027-03-25","(Sterofoam) Ruangan Pak Danny"],[77,"0895343016366","Three","2027-03-25",""],[78,"0895343016334","Three","2027-03-26",""],[79,"0895336339870","Three","2027-03-27","CS ALDA (Nisa_6_3)"],[80,"0895343016283","Three","2027-03-29","CS FITRI"],[81,"0895336340119","Three","2027-04-15",""],[82,"0895343017219","Three","2027-04-17","CS LILI"],[83,"0895336340130","Three","2027-04-18",""],[84,"089514036109","Three","2027-05-01",""],[85,"08971535163","Three","2027-05-01",""],[86,"08985366512","Three","2027-05-01","(Sterofoam) Ruangan Pak Danny"],[87,"089514013091","Three","2027-05-14","(Sterofoam) Ruangan Pak Danny"],[88,"089514013165","Three","2027-05-14","(Sterofoam) Ruangan Pak Danny"],[89,"089514013354","Three","2027-05-14","(Sterofoam) Ruangan Pak Danny"],[90,"089514032089","Three","2027-05-14","(Sterofoam) Ruangan Pak Danny"],[91,"089514032859","Three","2027-05-14","(Sterofoam) Ruangan Pak Danny"],[92,"089530126870","Three","2027-05-14","(Sterofoam) Ruangan Pak Danny"],[93,"08971533668","Three","2027-05-14","(Sterofoam) Ruangan Pak Danny"],[94,"089530124891","Three","2027-05-17","(Sterofoam) Ruangan Pak Danny"],[95,"08985366693","Three","2027-05-18","(Sterofoam) Ruangan Pak Danny"],[96,"0895336339869","Three","2027-05-19",""],[97,"0895343016280","Three","2027-05-19","CS FITRI"],[98,"0895343017227","Three","2027-05-19",""],[99,"089514012463","Three","2027-05-29","(Sterofoam) Ruangan Pak Danny"],[100,"089514012326","Three","2027-05-31","(Sterofoam) Ruangan Pak Danny"],[101,"083840040009","Axis","2027-06-04","HP LAMA jk"],[102,"089514013551","Three","2027-06-05","(Sterofoam) Ruangan Pak Danny"],[103,"085725628639","Indosat","2027-06-08",""],[104,"089514013545","Three","2027-06-10","(Sterofoam) Ruangan Pak Danny"],[105,"089529002944","Three","2027-06-10","HRD Ihza/HRD Fajar"],[106,"085799091415","Indosat","2027-06-13",""],[107,"085740000609","Indosat","2027-08-13","CS Rari"],[108,"0895336340113","Three","2027-08-30",""],[109,"085707001011","Indosat","2027-09-07",""],[110,"085713900090","Indosat","2027-09-09","CS ALDA"],[111,"089526561989","Three","2027-09-20",""],[112,"085330000029","Telkomsel","2027-09-30","CS WIKA (Lelly_8_5)"],[113,"089625498511","Three","2027-10-05","CS K.1 (Fara_6_2) [Ruangan Pak Danny]"],[114,"0895336340122","Three","2027-10-07",""],[115,"089633040200","Three","2027-10-07",""],[116,"085701111308","Indosat","2027-11-11","CS WIKA (Lelly_8_1)"],[117,"081804376001","XL","2027-11-16","Vantri [Ruangan Pak Danny]"],[118,"087719191133","XL","2027-11-16","CS BAYU (Bayu_5_1)"],[119,"081904000541","XL","2027-12-13",""],[120,"081903240011","XL","2028-01-10",""],[121,"087774333102","XL","2028-01-10","Vantri [Ruangan Pak Danny]"],[122,"089626571287","Three","2028-10-03","Vantri (Pak Danny) [Ruangan Pak Danny]"],[123,"089652380794","Three","2029-08-10","CS FITRI"],[124,"0895335175068","Three","2029-10-07","(Sterofoam) Ruangan Pak Danny"],[125,"081282222201","Telkomsel","","CS LILI"],[126,"081392634442","Telkomsel","","Pak Danny"],[127,"081818181013","XL","",""],[128,"082220136074","Telkomsel","","Diambil Pak Danny"],[129,"082227427003","Telkomsel","","Mbak Pipit"],[130,"082243809983","Telkomsel","","Mbak Pipit"],[131,"083840745469","Axis","","Mbak Pipit"],[132,"083840745599","Axis","","Mbak Pipit"],[133,"083840745639","Axis","","Vantri (Lelly_8_7) [Ruangan Pak Danny]"],[134,"083840745658","Axis","","Vantri (Lelly_8_3) [Ruangan Pak Danny]"],[135,"083842138236","Axis","","(Sterofoam) Ruangan Pak Danny"],[136,"085210177771","Telkomsel","",""],[137,"085228270001","Telkomsel","","Pak Danny"],[138,"085643333061","Indosat","","Pak Danny"],[139,"085701111190","Telkomsel","","Mbak Pipit"],[140,"08571322114","Telkomsel","","Mbak Pipit"],[141,"085743101001","Indosat","","Pak Danny"],[142,"087719999132","XL","","Pak Danny"],[143,"087770007051","XL","","Pak Danny"],[144,"089515303280","Three","",""],[145,"089527112119","Three","",""],[146,"0895360868134","Three","","(Sterofoam) Ruangan Pak Danny"],[147,"0895360868157","Three","","(Sterofoam) Ruangan Pak Danny"],[148,"089606720624","Three","","CS FITRI"],[149,"089633040123","Three","",""],[150,"089674494301","Three","","Mbak Pipit"]];
  sh.getRange(2, 1, SEED.length, 5).setNumberFormat("@").setValues(SEED);
  return SEED.length + " nomor dimuat ke sheet " + SH_NOMOR + ".";
}
// ===== DUMMY PENGETESAN 4 KELOMPOK (menu Jalankan Reminder) =====
// Nomor-nomor ini bukan nomor kantor, cuma buat uji tampilan. Hapus pakai hapusDummyTes().
var NOMOR_DUMMY = ['08999000001', '08999000002', '08999000003', '08999000004'];

function dummyTgl(offsetHari) {
  var d = new Date();
  d.setDate(d.getDate() + offsetHari);
  return Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
}

function dummyHari(aYMD, bYMD) {
  var out = [];
  var cur = new Date(Number(aYMD.slice(0, 4)), Number(aYMD.slice(5, 7)) - 1, Number(aYMD.slice(8, 10)));
  var end = new Date(Number(bYMD.slice(0, 4)), Number(bYMD.slice(5, 7)) - 1, Number(bYMD.slice(8, 10)));
  while (cur <= end) {
    out.push(Utilities.formatDate(cur, TZ, 'yyyy-MM-dd'));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

// sisa yang TIDAK ada di daftar hari pengingat, biar nggak ikut kekirimin sebagai pengingat pertama
function dummySisaBebas(hp, hMax, dipakai) {
  for (var s = 0; s <= hMax; s++) {
    if (hp.indexOf(s) !== -1 || dipakai.indexOf(s) !== -1) continue;
    return s;
  }
  return hMax + 1;
}

function dummyLogPada(tglYMD, r, status, jenis, ke) {
  var sh = sheetLog();
  var s = getSettings();
  var tpl = jenis === 'nagih' ? s.template_nagih : s.template_pesan;
  var d = new Date(Number(tglYMD.slice(0, 4)), Number(tglYMD.slice(5, 7)) - 1, Number(tglYMD.slice(8, 10)), 9, 5, 0);
  sh.appendRow([d, String(r.nomor), r.sisa + selisihHari(tglYMD, todayYMD()), status, formatPesan(tpl, r, ke), 'dummy pengetesan', jenis]);
  sh.getRange(sh.getLastRow(), 2).setNumberFormat('@').setValue(String(r.nomor));
}

function dummyBaris(nomor, operator, sisa, pj, statusTindak, mulai) {
  var sh = sheetNomor();
  var tgl = dummyTgl(sisa);
  var id = nextId();
  sh.appendRow([id, nomor, operator, tgl, pj, '', 'dummy pengetesan — hapus lewat hapusDummyTes()', statusTindak, mulai]);
  var row = sh.getLastRow();
  sh.getRange(row, 2).setNumberFormat('@').setValue(nomor);
  sh.getRange(row, 4).setNumberFormat('@').setValue(tgl);
  sh.getRange(row, 9).setNumberFormat('@').setValue(mulai);
  return { id: id, nomor: nomor, operator: operator, tgl_tenggang: tgl, penanggungjawab: pj, sisa: sisa, kategori: kategoriDari(tgl, todayYMD()) };
}

function isiDummyTes() {
  var hp = hariPengingat();
  var hMax = hp.length ? Math.max.apply(null, hp) : 7;
  var esk = Math.max(1, parseInt(getSettings().eskalasi_setelah, 10) || 3);
  var kemarin = dummyTgl(-1);
  var hasil = [];

  var ada = {};
  bacaNomor().forEach(function (r) { ada[r.nomor] = 1; });
  NOMOR_DUMMY.forEach(function (n) { if (ada[n]) throw new Error('Dummy ' + n + ' sudah ada di daftar. Jalankan hapusDummyTes() dulu.'); });

  var sDue = hp.indexOf(0) !== -1 ? 0 : (hp.length ? Math.min.apply(null, hp) : 0);
  var r1 = dummyBaris(NOMOR_DUMMY[0], 'Three', sDue, 'TES - habis hari ini', '', '');
  hasil.push('Habis hari ini : ' + r1.nomor + ' (sisa ' + sDue + ' hari)');

  var sNagih = dummySisaBebas(hp, hMax, [sDue]);
  var mulaiNagih = esk > 1 ? dummyTgl(-(esk - 1)) : todayYMD();
  var r2 = dummyBaris(NOMOR_DUMMY[1], 'Three', sNagih, 'TES - pengingat ulang', '', mulaiNagih);
  var ln = dummyHari(mulaiNagih, kemarin);
  ln.forEach(function (t, i) { dummyLogPada(t, r2, 'terkirim', i === 0 ? 'reminder' : 'nagih', i); });
  hasil.push('Pengingat ulang : ' + r2.nomor + ' (sisa ' + sNagih + ' hari, diinget sejak ' + mulaiNagih + ')');

  var r3 = dummyBaris(NOMOR_DUMMY[2], 'Three', hMax + 1, 'TES - perlu ditindak', 'perlu', '');
  hasil.push('Perlu ditindak  : ' + r3.nomor + ' (sisa ' + (hMax + 1) + ' hari, status Perlu)');

  var sTunggak = dummySisaBebas(hp, hMax, [sDue, sNagih]);
  if (sTunggak === hMax + 1) sTunggak = hMax + 2;
  var mulaiEsk = dummyTgl(-esk);
  var r4 = dummyBaris(NOMOR_DUMMY[3], 'Three', sTunggak, 'TES - terlambat', '', mulaiEsk);
  var le = dummyHari(mulaiEsk, kemarin);
  le.forEach(function (t, i) { dummyLogPada(t, r4, 'terkirim', i === 0 ? 'reminder' : 'nagih', i); });
  hasil.push('Terlambat ' + esk + '+: ' + r4.nomor + ' (sisa ' + sTunggak + ' hari, diinget sejak ' + mulaiEsk + ')');

  return hasil.join('\n') + '\n\n4 baris dummy + ' + (ln.length + le.length) + ' log riwayat masuk. Hapus lagi: jalankan hapusDummyTes().';
}

function hapusDummyTes() {
  var sh = sheetNomor();
  var baris = bacaNomor().filter(function (r) {
    return NOMOR_DUMMY.indexOf(r.nomor) !== -1 || /^TES\b/.test(String(r.penanggungjawab || ''));
  });
  baris.sort(function (a, b) { return b.row - a.row; });
  baris.forEach(function (r) { sh.deleteRow(r.row); });

  var lsh = sheetLog();
  var last = lsh.getLastRow();
  var idx = [];
  if (last > 1) {
    var vals = lsh.getRange(2, 1, last - 1, 2).getValues();
    vals.forEach(function (v, i) { if (NOMOR_DUMMY.indexOf(String(v[1])) !== -1) idx.push(i + 2); });
  }
  idx.sort(function (a, b) { return b - a; });
  idx.forEach(function (row) { lsh.deleteRow(row); });

  return baris.length + ' baris dummy dan ' + idx.length + ' log tes dihapus.';
}
