// Shim google.script.run untuk preview lokal (data dari mock.js).
var LOG = CONTOH.log.slice();
var JALAN = { sumber: 'otomatis', terakhir: CONTOH.hariIni + ' 09:00', terkirim: 3, dicatat: 0, gagal: 0, pengingatUlang: 2, eskalasi: 0, tertahan: 0, rekap: 'tidak aktif', backup: 'tersimpan' };
var NOMOR = CONTOH.nomor.map(function (n, i) {
  var sisa = null, kategori = 'belum';
  if (n[2]) {
    var sel = Math.round((new Date(n[2] + 'T00:00:00') - new Date(CONTOH.hariIni + 'T00:00:00')) / 86400000);
    sisa = sel;
    kategori = sel < 0 ? 'hangus' : (sel <= 3 ? 'kritis' : (sel <= 7 ? 'segera' : 'aman'));
  }
  return {
    row: i + 2, id: i + 1, nomor: n[0], operator: n[1], tgl_tenggang: n[2], penanggungjawab: n[3],
    catatan: n[5] || '', status_tindak: n[6] || '', mulai_diinget: n[7] || '',
    umur_diinget: n[7] ? Math.round((new Date(CONTOH.hariIni + 'T00:00:00') - new Date(n[7] + 'T00:00:00')) / 86400000) : null,
    dibuat: '2026-10-08 08:00', kategori: kategori, sisa: sisa, diinget: n[4]
  };
});

function hariYmd(l) { return l.ymd; }
var NAMA_KONTAK = {};
var ARSIP = {};function hariPengingat() {
  return String(CONTOH.settings.hari_pengingat).split(',').map(function (x) { return parseInt(x, 10); }).filter(function (n) { return !isNaN(n); });
}
function kategoriCount() {
  var s = { total: NOMOR.length, aman: 0, segera: 0, kritis: 0, hangus: 0, belum: 0, perlu: 0, proses: 0, beres: 0, tunggak: 0 };
  var esk = parseInt(CONTOH.settings.eskalasi_setelah, 10) || 3;
  isiStatusOtomatisLokal(NOMOR);
  NOMOR.forEach(function (r) {
    s[r.kategori] = (s[r.kategori] || 0) + 1;
    if (r.status_efektif) s[r.status_efektif] = (s[r.status_efektif] || 0) + 1;
    if (r.mulai_diinget && r.status_efektif !== 'beres' && r.umur_diinget >= esk) s.tunggak++;
  });
  s.total = NOMOR.length;
  return s;
}
function balasanMasukLokal(nomor) {
  var nm = norm(nomor), terbaik = '';
  LOG.forEach(function (l) {
    if ((l.jenis || 'reminder') !== 'masuk' && l.status !== 'masuk') return;
    if (norm(l.nomor) !== nm) return;
    if (l.ymd > terbaik) terbaik = l.ymd;
  });
  return terbaik;
}
function isiStatusOtomatisLokal(rows) {
  var hp = hariPengingat(), hMax = hp.length ? Math.max.apply(null, hp) : 7;
  rows.forEach(function (r) {
    r.balasan = balasanMasukLokal(r.nomor);
    var auto = '';
    if (r.mulai_diinget && r.sisa !== null && r.sisa >= 0 && r.sisa <= hMax) {
      auto = (r.balasan && r.balasan >= r.mulai_diinget) ? 'proses' : 'perlu';
    }
    r.status_auto = auto;
    r.status_efektif = r.status_tindak || auto;
  });
  return rows;
}
function norm(n) {
  var d = String(n).replace(/\D+/g, '');
  if (!d) return '';
  if (d.indexOf('62') === 0) return '0' + d.substring(2);
  return d.charAt(0) === '0' ? d : '0' + d;
}
function tambahLog(nomor, status, pesan, hari_ke, jenis) {
  LOG.push({
    row: LOG.length + 2, ymd: CONTOH.hariIni, hm: '10:30', nomor: nomor, hari_ke: hari_ke || '-',
    status: status, pesan: pesan, jenis: jenis || 'reminder', waktu: jam(CONTOH.hariIni, '10:30')
  });
}

var BULANPendek = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function tglIdLokal(ymd) {
  var m = String(ymd || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return String(ymd || '');
  return parseInt(m[3], 10) + ' ' + BULANPendek[parseInt(m[2], 10) - 1] + ' ' + m[1];
}
function isiTplLokal(tpl, map) {
  var out = String(tpl === undefined || tpl === null ? '' : tpl);
  Object.keys(map).forEach(function (k) { out = out.split('{' + k + '}').join(map[k]); });
  return out;
}
function formatPesanLokal(template, r, ke) {
  var sisa = (r.sisa === null || r.sisa === undefined) ? '' : r.sisa;
  var pic = String(r.penanggungjawab || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  return String(template)
    .split('{nomor}').join(r.nomor)
    .split('{operator}').join(r.operator || '')
    .split('{tgl}').join(r.tgl_tenggang ? tglIdLokal(r.tgl_tenggang) : '')
    .split('{sisa}').join(sisa)
    .split('{ke}').join(ke || '')
    .split('{pic}').join(pic !== '' ? ' ' + pic : '');
}

var API = {
  getDashboard: function () {
    return {
      stats: kategoriCount(),
      dipantau: NOMOR.filter(function (r) { return r.kategori !== 'hangus'; }),
      hangus: NOMOR.filter(function (r) { return r.kategori === 'hangus'; }),
      operators: ['AXIS', 'Indosat', 'Smartfren', 'Telkomsel', 'Three', 'XL'],
      settings: CONTOH.settings,
      jadwal: API.triggerInfo(),
      hariIni: CONTOH.hariIni
    };
  },
  getWaRingkas: function () {
    var o = { terkirim: 0, dryRun: 0, masuk: 0, gagal: 0, nagih: 0, eskalasi: 0, kirimHariIni: 0, keluarHariIni: 0, masukHariIni: 0, nagihHariIni: 0, total: LOG.length };
    LOG.forEach(function (l) {
      var jenis = l.jenis || 'reminder';
      if (jenis === 'eskalasi') { o.eskalasi++; if (l.ymd === CONTOH.hariIni) o.keluarHariIni++; return; }
      if (l.status === 'masuk') { o.masuk++; if (l.ymd === CONTOH.hariIni) o.masukHariIni++; return; }
      if (jenis === 'nagih') { o.nagih++; if (l.ymd === CONTOH.hariIni) o.nagihHariIni++; }
      if (l.status === 'gagal') o.gagal++;
      else if (l.status === 'dry-run') o.dryRun++;
      else o.terkirim++;
      if (l.ymd === CONTOH.hariIni) { o.keluarHariIni++; if (l.status === 'terkirim') o.kirimHariIni++; }
    });
    return o;
  },
  getRiwayatPage: function (page, size, st, q, tgl) {
    var all = LOG.slice().reverse().map(function (l) {
      return { row: l.row, waktu: l.waktu, nomor: norm(l.nomor), hari_ke: l.hari_ke, status: l.status, pesan: l.pesan, jenis: l.jenis || 'reminder' };
    });
    if (tgl) all = all.filter(function (x) { return String(x.waktu).substring(0, 10) === String(tgl); });
    if (st) all = all.filter(function (x) { return x.status === st; });
    if (q) all = all.filter(function (x) { return x.nomor.toLowerCase().indexOf(String(q).toLowerCase()) !== -1; });
    var pages = Math.max(1, Math.ceil(all.length / size));
    return { rows: all.slice((page - 1) * size, (page - 1) * size + size), total: all.length, page: page, size: size, pages: pages };
  },
  getRiwayat: function (limit, arah) {
    var out = LOG.slice().reverse().filter(function (l) {
      if (arah === 'masuk') return l.status === 'masuk';
      if (arah === 'keluar') return l.status !== 'masuk';
      return true;
    }).map(function (l) { return { waktu: l.waktu, nomor: norm(l.nomor), hari_ke: l.hari_ke, status: l.status, pesan: l.pesan, jenis: l.jenis || 'reminder' }; });
    return out.slice(0, limit || 50);
  },
  getChatContacts: function () {
    var map = {}, urut = [];
    LOG.forEach(function (l) {
      var nm = norm(l.nomor); if (!nm) return;
      if (!map[nm]) { map[nm] = { nomor: nm, count: 0, inCount: 0, last: '', waktu: '', ts: 0, nama: '' }; urut.push(nm); }
      map[nm].count++; map[nm].last = l.pesan; map[nm].waktu = l.waktu.replace(/ \d\d:\d\d$/, '');
      if (l.status === 'masuk') { map[nm].inCount++; if (!map[nm].nama) map[nm].nama = 'ys'; }
    });
    var terdaftar = {}; NOMOR.forEach(function (r) { terdaftar[r.nomor] = r; });
    urut.forEach(function (nm) { if (!map[nm]) map[nm] = { nomor: nm, count: 0, inCount: 0, last: '', waktu: '', ts: 0, nama: '' }; });
    var daftar = Object.keys(terdaftar).concat(urut);
    var uniq = daftar.filter(function (x, i) { return daftar.indexOf(x) === i; });
    return uniq.map(function (nm) {
      var l = map[nm] || { count: 0, inCount: 0, last: '', waktu: '' }, r = terdaftar[nm] || {};
      return { nomor: nm, operator: r.operator || '', pj: r.penanggungjawab || '', nama: NAMA_KONTAK[nm] || l.nama || '', arsip: !!ARSIP[nm], last: l.last, waktu: l.waktu, count: l.count, inCount: l.inCount, terdaftar: !!terdaftar[nm] };
    }).sort(function (a, b) { return (b.count ? 1 : 0) - (a.count ? 1 : 0) || (a.nomor < b.nomor ? -1 : 1); });
  },
  setNamaKontak: function (nomor, nama) {
    var nm = norm(nomor), bersih = String(nama || '').trim().substring(0, 40);
    if (bersih) NAMA_KONTAK[nm] = bersih; else delete NAMA_KONTAK[nm];
    return { ok: true, nomor: nm, nama: bersih };
  },
  arsipKontak: function (nomor, mauArsip) {
    var nm = norm(nomor);
    if (mauArsip) ARSIP[nm] = 1; else delete ARSIP[nm];
    return { ok: true, nomor: nm, arsip: !!mauArsip };
  },
  getChatLog: function (nomor) {
    var kunci = norm(nomor);
    return LOG.filter(function (l) { return norm(l.nomor) === kunci; }).map(function (l) {
      return { row: l.row, waktu: l.waktu, pesan: l.pesan, status: l.status, arah: l.status === 'masuk' ? 'in' : 'out' };
    });
  },
  hapusLogRow: function (row) {
    LOG = LOG.filter(function (l) { return l.row !== row; });
    return { deleted: row };
  },
  hapusLogTerpilih: function (rows) {
    var mau = (rows || []).map(function (r) { return parseInt(r, 10); });
    var sebelum = LOG.length;
    LOG = LOG.filter(function (l) { return mau.indexOf(l.row) < 0; });
    return { terhapus: sebelum - LOG.length };
  },
  bersihkanDobelan: function (dryRun) {
    var terakhir = {}, buang = [];
    LOG.slice().sort(function (a, b) { return (a.ymd + a.hm) < (b.ymd + b.hm) ? -1 : 1; }).forEach(function (l) {
      if (l.status !== 'masuk') return;
      var k = norm(l.nomor) + '|' + String(l.pesan).trim();
      var t = new Date(l.ymd + 'T' + l.hm + ':00').getTime();
      if (terakhir[k] && (t - terakhir[k]) <= 3 * 60 * 1000) { buang.push(l.row); return; }
      terakhir[k] = t;
    });
    if (!dryRun) { var set = buang; LOG = LOG.filter(function (l) { return set.indexOf(l.row) < 0; }); }
    return { kandidat: buang.length, terhapus: dryRun ? 0 : buang.length };
  },
  hapusChatNomor: function (nomor) {
    var k = norm(nomor), n = LOG.length;
    LOG = LOG.filter(function (l) { return norm(l.nomor) !== k; });
    return { deleted: n - LOG.length, nomor: k };
  },
  simpanKontakChat: function (nomor) {
    var nm = norm(nomor);
    if (NOMOR.some(function (r) { return r.nomor === nm; })) return { ok: true, sudah: true, nomor: nm };
    NOMOR.push({ row: NOMOR.length + 2, id: NOMOR.length + 1, nomor: nm, operator: '', tgl_tenggang: '', penanggungjawab: '', catatan: '', status_tindak: '', mulai_diinget: '', umur_diinget: null, dibuat: CONTOH.hariIni, kategori: 'belum', sisa: null, diinget: null });
    return { ok: true, nomor: nm };
  },
  kirimPesanBebas: function (target, pesan) {
    var nm = norm(target);
    tambahLog(nm, 'terkirim', pesan, '-', 'chat');
    return { status: 'terkirim', respons: 'success (contoh)', nomor: nm };
  },
  getDetailNomor: function (id) {
    var r = NOMOR.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!r) throw new Error('Nomor tidak ditemukan (contoh).');
    return {
      nomor: r,
      riwayat: LOG.filter(function (l) { return norm(l.nomor) === norm(r.nomor); }).map(function (l) {
        return { waktu: l.waktu, hari_ke: l.hari_ke, status: l.status, pesan: l.pesan, jenis: l.jenis || 'reminder' };
      }).reverse(),
      pratinjau: r.tgl_tenggang ? formatPesanLokal(CONTOH.settings.template_pesan, r) : ''
    };
  },
  setStatusTindak: function (id, status) {
    var r = NOMOR.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!r) throw new Error('Nomor tidak ditemukan (contoh).');
    r.status_tindak = status || '';
    if (status === 'perlu') { if (!r.mulai_diinget) { r.mulai_diinget = CONTOH.hariIni; r.umur_diinget = 0; } }
    else if (status !== 'proses') { r.mulai_diinget = ''; r.umur_diinget = null; }
    return { ok: true, status: r.status_tindak };
  },
  setStatusTindakTerpilih: function (ids, status) {
    (ids || []).forEach(function (id) { API.setStatusTindak(id, status); });
    return { diubah: (ids || []).length, status: status };
  },
  cekKesehatanData: function () {
    var t = { duplikat: [], tanpaTanggal: [],  tanpaPic: [], nomorRusak: [] };
    var perNomor = {};
    isiStatusOtomatisLokal(NOMOR);
    NOMOR.forEach(function (r) {
      var k = norm(r.nomor);
      (perNomor[k] = perNomor[k] || []).push(r);
      if (!/^(0|\+?62)[0-9]{7,14}$/.test(String(r.nomor))) t.nomorRusak.push({ id: r.id, nomor: r.nomor, operator: r.operator });
      if (!r.tgl_tenggang) t.tanpaTanggal.push({ id: r.id, nomor: r.nomor, operator: r.operator, pj: r.penanggungjawab });
      if (!String(r.penanggungjawab || '').trim()) t.tanpaPic.push({ id: r.id, nomor: r.nomor, operator: r.operator });
    });
    Object.keys(perNomor).forEach(function (k) {
      if (k && perNomor[k].length > 1) t.duplikat.push({ nomor: k, jumlah: perNomor[k].length, tanggal: perNomor[k].map(function (r) { return r.tgl_tenggang || '-'; }),
        salin: perNomor[k].map(function (r) { return { id: r.id, tgl: r.tgl_tenggang || '', pj: r.penanggungjawab || '', kategori: r.kategori }; }) });
    });
    var masalah = t.duplikat.length + t.tanpaTanggal.length + t.tanpaPic.length + t.nomorRusak.length;
    return { hariIni: CONTOH.hariIni, total: NOMOR.length, temuan: t, masalah: masalah, skor: NOMOR.length ? Math.round(100 - (masalah / NOMOR.length) * 100) : 100 };
  },
  getLaporan: function () {
    var s = kategoriCount(), series = [];
    for (var i = 29; i >= 0; i--) {
      var d = new Date(CONTOH.hariIni + 'T00:00:00'); d.setDate(d.getDate() - i);
      var ymd = d.toISOString().substring(0, 10);
      series.push({ tgl: ymd, terkirim: LOG.filter(function (l) { return l.ymd === ymd && l.status === 'terkirim'; }).length, 'dry-run': 0, gagal: LOG.filter(function (l) { return l.ymd === ymd && l.status === 'gagal'; }).length });
    }
    return { total: NOMOR.length, statusCounts: s, hariIniCount: { terkirim: s.total, 'dry-run': 0, gagal: 0 }, series: series, hariIni: CONTOH.hariIni };
  },
  getLaporanBulan: function (ym) {
    var bulan = String(ym || CONTOH.hariIni).substring(0, 7);
    var akt = { terkirim: 0, 'dry-run': 0, gagal: 0, masuk: 0 }; var balas = {}; var hari = {};
    LOG.forEach(function (l) {
      if (String(l.ymd).substring(0, 7) !== bulan) return;
      if (akt[l.status] !== undefined) akt[l.status]++;
      if (l.status === 'masuk') balas[norm(l.nomor)] = 1;
      hari[l.ymd] = 1;
    });
    var jt = NOMOR.filter(function (r) { return String(r.tgl_tenggang).substring(0, 7) === bulan; });
    jt.sort(function (a, b) { return a.tgl_tenggang < b.tgl_tenggang ? -1 : 1; });
    return {
      bulan: bulan, hariIni: CONTOH.hariIni,
      jatuhTempo: jt.map(function (r) { return { nomor: r.nomor, operator: r.operator, tgl: r.tgl_tenggang, sisa: r.sisa, kategori: r.kategori, pj: r.penanggungjawab, catatan: r.catatan }; }),
      aktivitas: akt, totalNomorBalas: Object.keys(balas).length, jumlahHariAktif: Object.keys(hari).length
    };
  },
  getRekapHarian: function () {
    var o = API.getWaRingkas(); var k = kategoriCount();
    var jadwal = hariPengingat();
    var belum = NOMOR.filter(function (r) { return r.sisa !== null && jadwal.indexOf(r.sisa) !== -1 && r.diinget !== 'terkirim'; });
    var terjadwal = NOMOR.filter(function (r) { return r.sisa !== null && jadwal.indexOf(r.sisa) !== -1; });
    var baris = [
      '*Rekap Pengingat Nomor — ' + tglIdLokal(CONTOH.hariIni) + '*',
      'Total dipantau: ' + (NOMOR.length - k.hangus) + ' nomor',
      'Kritis (<=3 hari): ' + k.kritis + ' | Segera (<=7 hari): ' + k.segera,
      'Pengingat terjadwal hari ini: ' + terjadwal.length + ' (sudah terkirim: ' + o.kirimHariIni + ')'
    ];
    if (belum.length) baris.push('Belum terkirim: ' + belum.map(function (r) { return r.nomor + ' (H-' + r.sisa + ')'; }).join(', '));
    if (k.belum) baris.push('Tanggal masa aktif belum diisi: ' + k.belum);
    if (k.hangus) baris.push('Sudah hangus (tidak dipantau): ' + k.hangus);
    baris.push('Balasan masuk hari ini: ' + o.masukHariIni);
    var kuota = parseInt(CONTOH.settings.kuota_harian, 10) || 0;
    if (kuota > 0) baris.push('Kuota harian: ' + o.keluarHariIni + '/' + kuota + ' terpakai');
    if (o.nagihHariIni) baris.push('Nagih ulang hari ini: ' + o.nagihHariIni);
    if (k.tunggak) baris.push('Belum ada kabar setelah ' + (parseInt(CONTOH.settings.eskalasi_setelah, 10) || 3) + ' hari: ' + k.tunggak + ' nomor');
    if (o.gagal) baris.push('PENGINGAT GAGAL: ' + o.gagal + ' — perlu dicek');
    var badan = baris.slice(1).join('\n');
    var tplRekap = String(CONTOH.settings.template_rekap || '').trim();
    var pesanRekap = tplRekap ? isiTplLokal(tplRekap, { tanggal: tglIdLokal(CONTOH.hariIni), isi: badan }) : baris.join('\n');
    return { pesan: pesanRekap, ringkas: k, belum: belum.map(function (r) { return r.nomor; }), tujuan: CONTOH.settings.nomor_rekap, hariIni: CONTOH.hariIni };
  },
  kirimRekap: function (dry, override) {
    var tujuan = String(override || CONTOH.settings.nomor_rekap || '').trim();
    if (!tujuan) throw new Error('Nomor rekap belum diisi.');
    var r = API.getRekapHarian();
    tambahLog(tujuan, dry ? 'dry-run' : 'terkirim', r.pesan, '-', 'rekap');
    return { status: dry ? 'dry-run' : 'terkirim', pesan: r.pesan, tujuan: tujuan };
  },
  tandaiSudahDiisi: function (id, tgl) {
    var r = NOMOR.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!r) throw new Error('Nomor tidak ditemukan (contoh).');
    var sel = Math.round((new Date(tgl + 'T00:00:00') - new Date(CONTOH.hariIni + 'T00:00:00')) / 86400000);
    r.tgl_tenggang = tgl; r.sisa = sel;
    r.kategori = sel < 0 ? 'hangus' : (sel <= 3 ? 'kritis' : (sel <= 7 ? 'segera' : 'aman'));
    var jejak = jam(CONTOH.hariIni, '').trim() + ': diisi pulsa, aktif s/d ' + tgl;
    r.catatan = r.catatan ? r.catatan + '\n' + jejak : jejak;
    r.status_tindak = 'beres'; r.mulai_diinget = ''; r.umur_diinget = null;
    return { ok: true, tgl: tgl, sisa: sel };
  },
  backupKeDrive: function () {
    CONTOH.backupTerakhir = CONTOH.hariIni + ' 10:30';
    return { ok: true, nama: 'backup-tenggang-' + CONTOH.hariIni + '.json', url: 'https://drive.google.com/drive/folders/contoh', ukuran: 20480 };
  },
  getSettings: function () { return CONTOH.settings; },
  saveSettings: function (s) { Object.keys(s || {}).forEach(function (k) { CONTOH.settings[k] = s[k]; }); return CONTOH.settings; },
  triggerInfo: function () {
    return { aktif: CONTOH.jadwal !== false, jam: CONTOH.settings.jam_kirim, rekap: CONTOH.settings.rekap_aktif === '1', nomor_rekap: CONTOH.settings.nomor_rekap,
      backup_aktif: CONTOH.settings.backup_drive === '1', backup_terakhir: CONTOH.backupTerakhir || '2026-10-09 23:00', backup_folder: 'Backup Nomor Tenggang',
      jalan: JALAN };
  },
  pasangTrigger: function () { return { aktif: true, jam: CONTOH.settings.jam_kirim }; },
  hapusTrigger: function () { return { aktif: false }; },
  getWebhookUrl: function () {
    return { url: 'https://script.google.com/macros/s/CONTOHDEPLOYMENTID/exec', dashboardUrl: 'https://script.google.com/macros/s/CONTOHDEPLOYMENTID/exec?kunci=contoh123' };
  },
  pratinjauContoh: function (template, ke) {
    var d = new Date(CONTOH.hariIni + 'T00:00:00'); d.setDate(d.getDate() + 7);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    var sample = { nomor: '081234567890', operator: 'Telkomsel', tgl_tenggang: d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()), penanggungjawab: 'Vantri (Admin)', sisa: 7 };
    return formatPesanLokal(template || CONTOH.settings.template_pesan, sample, ke || 1);
  },
  pratinjauUntukNomor: function (nomor) {
    var nm = norm(nomor);
    var r = NOMOR.filter(function (x) { return norm(x.nomor) === nm; })[0];
    if (!r) throw new Error('Nomor itu belum ada di daftar, jadi tanggal aktifnya belum diketahui.');
    return formatPesanLokal(CONTOH.settings.template_pesan, r);
  },
  simpanTemplate: function (obj) {
    var bersih = {};
    ['template_pesan', 'template_nagih', 'template_eskalasi', 'template_rekap'].forEach(function (k) {
      if (obj && obj[k] !== undefined && String(obj[k]).trim() !== '') bersih[k] = String(obj[k]);
    });
    if (obj && obj.preset_chat !== undefined) bersih.preset_chat = String(obj.preset_chat);
    if (!Object.keys(bersih).length) throw new Error('Template-nya kosong, tidak jadi disimpan.');
    return API.saveSettings(bersih);
  },
  kirimSekarang: function (id, dry) { return { status: dry ? 'dry-run' : 'terkirim', pesan: 'contoh', respons: 'ok' }; },
  kirimTerpilih: function (ids, dry) { return { diproses: ids.length, terkirim: ids.length, 'dry-run': 0, gagal: 0 }; },
  hapusTerpilih: function (ids) { NOMOR = NOMOR.filter(function (x) { return (ids || []).indexOf(x.id) === -1 && String(ids || []).indexOf(String(x.id)) === -1; }); return { terhapus: (ids || []).length }; },
  bulkUpdate: function (ids, f) {
    NOMOR.forEach(function (x) {
      if ((ids || []).map(String).indexOf(String(x.id)) === -1) return;
      if (f) {
        if (f.operator) x.operator = f.operator;
        if (f.penanggungjawab) x.penanggungjawab = f.penanggungjawab;
        if (f.tgl_tenggang) {
          x.tgl_tenggang = f.tgl_tenggang;
          var sel = Math.round((new Date(f.tgl_tenggang + 'T00:00:00') - new Date(CONTOH.hariIni + 'T00:00:00')) / 86400000);
          x.sisa = sel; x.kategori = sel < 0 ? 'hangus' : (sel <= 3 ? 'kritis' : (sel <= 7 ? 'segera' : 'aman'));
        }
      }
    });
    return { diubah: (ids || []).length, status: (f && f.status) || '' };
  },
  kirimTes: function () { return { status: 'terkirim', respons: 'contoh' }; },
  jalankanReminder: function (dry, sumber) {
    var hp = hariPengingat();
    var hMax = hp.length ? Math.max.apply(null, hp) : 7;
    var kuota = parseInt(CONTOH.settings.kuota_harian, 10) || 0;
    var eskAfter = parseInt(CONTOH.settings.eskalasi_setelah, 10) || 3;
    var terpakai = API.getWaRingkas().keluarHariIni;
    var sudah = {};
    LOG.forEach(function (l) { if (l.ymd === CONTOH.hariIni && (l.jenis || 'reminder') !== 'masuk' && (l.jenis || 'reminder') !== 'eskalasi' && l.status !== 'gagal') sudah[norm(l.nomor)] = 1; });
    var hasil = { diproses: 0, terkirim: 0, 'dry-run': 0, gagal: 0, nagih: 0, eskalasi: 0, tertahan: 0, kuota: kuota, kuotaPakai: terpakai, entri: [] };
    function kirim(r, pesan, jenis) {
      if (kuota > 0 && terpakai >= kuota) {
        hasil.tertahan++;
        hasil.entri.push({ nomor: r.nomor, hari_ke: r.sisa, status: 'tertahan', jenis: jenis, pesan: pesan });
        return;
      }
      var st = dry ? 'dry-run' : 'terkirim';
      tambahLog(r.nomor, st, pesan, String(r.sisa), jenis);
      r.diinget = st;
      sudah[norm(r.nomor)] = 1;
      terpakai++;
      hasil.diproses++;
      hasil[st]++;
      if (jenis === 'nagih') hasil.nagih++;
      hasil.entri.push({ nomor: r.nomor, hari_ke: r.sisa, status: st, jenis: jenis, pesan: pesan });
    }
    NOMOR.forEach(function (r) {
      if (r.sisa === null || hp.indexOf(r.sisa) === -1) return;
      if (sudah[norm(r.nomor)]) return;
      if (!r.mulai_diinget) { r.mulai_diinget = CONTOH.hariIni; r.umur_diinget = 0; }
      kirim(r, formatPesanLokal(CONTOH.settings.template_pesan, r), 'reminder');
    });
    NOMOR.forEach(function (r) {
      if (r.sisa === null || r.sisa < 0 || r.sisa > hMax) return;
      if (r.status_tindak === 'beres' || r.status_tindak === 'proses') return;
      if (sudah[norm(r.nomor)]) return;
      if (!r.mulai_diinget) { r.mulai_diinget = CONTOH.hariIni; r.umur_diinget = 0; }
      var ke = 1 + LOG.filter(function (l) { return (l.jenis || '') === 'nagih' && norm(l.nomor) === norm(r.nomor) && String(l.ymd) >= r.mulai_diinget; }).length;
      kirim(r, formatPesanLokal(CONTOH.settings.template_nagih, r, ke), 'nagih');
    });
    var tunggak = NOMOR.filter(function (r) { return r.mulai_diinget && r.status_tindak !== 'beres' && r.umur_diinget >= eskAfter; });
    hasil.tunggakan = tunggak.length;
    if (tunggak.length && CONTOH.settings.nomor_rekap) {
      var isiEsk = tunggak.map(function (r) {
        return '• ' + r.nomor + ' (' + (r.operator || '-') + ') — sisa ' + r.sisa + ' hari, diinget sejak ' + tglIdLokal(r.mulai_diinget);
      }).join('\n');
      var tplEsk = String(CONTOH.settings.template_eskalasi || '').trim();
      var pesan = tplEsk ? isiTplLokal(tplEsk, { setelah: eskAfter, isi: isiEsk, jumlah: tunggak.length })
        : 'NOMOR BELUM BERES\nSudah ' + eskAfter + ' hari diingetin, belum ada konfirmasi pengisian pulsa:\n' + isiEsk + '\n\nTotal: ' + tunggak.length + ' nomor.';
      if (kuota <= 0 || terpakai < kuota) {
        var st = dry ? 'dry-run' : 'terkirim';
        tambahLog(CONTOH.settings.nomor_rekap, st, pesan, '-', 'eskalasi');
        terpakai++;
        hasil.eskalasi = tunggak.length;
        hasil.entri.push({ nomor: CONTOH.settings.nomor_rekap, hari_ke: '-', status: st, jenis: 'eskalasi', pesan: pesan });
      }
    }
    hasil.kuotaPakai = terpakai;
    JALAN = { sumber: sumber || 'manual', terakhir: CONTOH.hariIni + ' ' + String(new Date().getHours()) + ':00',
      terkirim: hasil.terkirim, dicatat: hasil['dry-run'], gagal: hasil.gagal, pengingatUlang: hasil.nagih,
      eskalasi: hasil.eskalasi, tertahan: hasil.tertahan, rekap: 'tidak aktif', backup: 'tidak aktif' };
    return hasil;
  },
  exportCsv: function () {
    var L = { aman: 'Aman', segera: 'Segera berakhir', kritis: 'Kritis', hangus: 'Kedaluwarsa', belum: 'Belum diisi tanggal' };
    var TK = { perlu: 'Perlu ditindak', proses: 'Sedang diurus', beres: 'Beres' };
    var q = function (s) { s = String(s == null ? '' : s); return s ? '"' + s.replace(/"/g, '""').replace(/\r?\n/g, ' | ') + '"' : ''; };
    var out = ['Nomor;Operator;Batas aktif;Sisa hari;Jatuh tempo;Penanggungjawab;Tindak lanjut;Catatan'];
    NOMOR.forEach(function (r) {
      out.push([q('="' + r.nomor + '"'), r.operator || '', r.tgl_tenggang || '', (r.sisa == null ? '' : r.sisa),
        L[r.kategori] || '', r.penanggungjawab || '', TK[r.status_tindak || r.status_auto] || 'Belum ada', q(r.catatan)].join(';'));
    });
    return { nama: 'rekap-contoh-' + CONTOH.hariIni + '.csv', isi: '﻿' + 'sep=;' + '\r\n' + out.join('\r\n') };
  },
  backupData: function () { return { nama: 'backup-contoh.json', isi: '{}' }; },
  previewImport: function () { return { total: 2, bisa: 2, baris: [{ nomor: '081234567815', ok: true, alasan: '' }, { nomor: 'abc', ok: false, alasan: 'format nomor salah' }] }; },
  commitImport: function () { return { masuk: 1, lewat: 1 }; },
  tambahNomor: function () { return { ok: true }; },
  updateNomor: function (obj) {
    var r = NOMOR.filter(function (x) { return String(x.id) === String(obj.id); })[0];
    if (r) {
      r.nomor = obj.nomor; r.operator = obj.operator; r.tgl_tenggang = obj.tgl_tenggang;
      r.penanggungjawab = obj.penanggungjawab; r.catatan = obj.catatan;
      var sel = Math.round((new Date(obj.tgl_tenggang + 'T00:00:00') - new Date(CONTOH.hariIni + 'T00:00:00')) / 86400000);
      r.sisa = obj.tgl_tenggang ? sel : null;
      r.kategori = !obj.tgl_tenggang ? 'belum' : (sel < 0 ? 'hangus' : (sel <= 3 ? 'kritis' : (sel <= 7 ? 'segera' : 'aman')));
    }
    return { ok: true };
  },
  hapusNomor: function (id) { NOMOR = NOMOR.filter(function (x) { return String(x.id) !== String(id); }); return { ok: true }; }
};

var google = (function () {
  function Run() { this._ok = null; this._fail = null; }
  Run.prototype.withSuccessHandler = function (f) { this._ok = f; return this; };
  Run.prototype.withFailureHandler = function (f) { this._fail = f; return this; };
  Object.keys(API).forEach(function (nama) {
    Run.prototype[nama] = function () {
      var self = this, args = Array.prototype.slice.call(arguments);
      setTimeout(function () {
        try { var hasil = API[nama].apply(null, args); if (self._ok) self._ok(hasil); }
        catch (err) { if (self._fail) self._fail(err); else console.warn(err); }
      }, 80);
      return self;
    };
  });
  var script = {};
  Object.defineProperty(script, 'run', { get: function () { return new Run(); } });
  return { script: script, preview: true };
})();
