/**
 * Pengingat Masa Aktif Nomor Kantor — Google Apps Script (web app)
 * Data: Google Sheet. Reminder: Fonnte (dry-run kalau API key belum diisi).
 */

var TZ = 'Asia/Jakarta';
var SH_NOMOR = 'Nomor';
var SH_LOG = 'Log';
var HEAD_NOMOR = ['id', 'nomor', 'operator', 'tgl_tenggang', 'penanggungjawab', 'dibuat', 'catatan', 'status_tindak', 'mulai_diinget'];
var K = { CATATAN: 7, STATUS: 8, MULAI: 9 };
var STATUS_TINDAK = ['perlu', 'proses', 'beres'];
var HEAD_LOG = ['waktu', 'nomor', 'hari_ke', 'status', 'pesan', 'respons', 'jenis'];

var DEFAULT_PENGATURAN = {
  hari_pengingat: '7,3,1',
  template_pesan: 'Halo{pic}, masa aktif nomor {nomor} ({operator}) akan berakhir pada {tgl} (sisa {sisa} hari). Mohon segera diisi pulsa agar tetap aktif. Terima kasih.',
  template_nagih: 'Halo{pic}, ini pengingat KE-{ke} untuk nomor {nomor} ({operator}). Masa aktifnya tinggal {sisa} hari ({tgl}) dan belum ada kabar pengisian pulsa. Mohon segera diisi. Terima kasih.',
  gateway: 'none',
  jam_kirim: '09:00',
  nomor_rekap: '',
  rekap_aktif: '0',
  backup_drive: '0',
  kuota_harian: '10',
  eskalasi_setelah: '3',
  template_eskalasi: 'NOMOR BELUM BERES\nSudah {setelah} hari diingetin, belum ada konfirmasi pengisian pulsa:\n{isi}\n\nTotal: {jumlah} nomor.',
  template_rekap: '*Rekap Pengingat Nomor \u2014 {tanggal}*\n{isi}',
  preset_chat: 'Halo, mohon jangan lupa isi pulsa nomornya ya.\nTes dari aplikasi pengingat nomor.',
  auto_beres: '1',
  laporan_bulan_aktif: '1'
};

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, SH_NOMOR, HEAD_NOMOR);
  ensureSheet(ss, SH_LOG, HEAD_LOG);
  return 'Sheet siap: ' + SH_NOMOR + ' & ' + SH_LOG;
}

function ensureSheet(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function sheetNomor() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH_NOMOR);
  if (!KOLOM_NOMOR_SIAP) { pastikanHeader(sh, HEAD_NOMOR); KOLOM_NOMOR_SIAP = true; }
  return sh;
}
var KOLOM_NOMOR_SIAP = false;

function sheetLog() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH_LOG);
  if (!KOLOM_LOG_SIAP) { pastikanHeader(sh, HEAD_LOG); KOLOM_LOG_SIAP = true; }
  return sh;
}
var KOLOM_LOG_SIAP = false;

// Kolom tambahan (catatan, status_tindak, jenis) baru ditambahkan belakangan; sheet lama belum punya.
function pastikanHeader(sh, heads) {
  var kurang = heads.length - sh.getMaxColumns();
  if (kurang > 0) sh.insertColumnsAfter(sh.getMaxColumns(), kurang);
  var headers = sh.getRange(1, 1, 1, heads.length).getValues()[0];
  var diubah = false;
  for (var c = 0; c < heads.length; c++) {
    if (String(headers[c] || '') !== heads[c]) { sh.getRange(1, c + 1).setValue(heads[c]); diubah = true; }
  }
  if (diubah) sh.getRange(1, 1, 1, heads.length).setFontWeight('bold');
}

// Nomor wajib disimpan sebagai teks, kalau tidak Sheets membuang angka 0 di depan.
function catatLog(nomor, hariKe, status, pesan, respons, jenis) {
  var sh = sheetLog();
  sh.appendRow([new Date(), String(nomor), hariKe, status, pesan, respons, jenis || 'reminder']);
  sh.getRange(sh.getLastRow(), 2).setNumberFormat('@').setValue(String(nomor));
}

function getSettings() {
  var p = PropertiesService.getScriptProperties();
  var out = {};
  for (var k in DEFAULT_PENGATURAN) out[k] = p.getProperty(k) !== null ? p.getProperty(k) : DEFAULT_PENGATURAN[k];
  out.api_key_set = !!p.getProperty('api_key');
  return out;
}

function saveSettings(obj) {
  var p = PropertiesService.getScriptProperties();
  ['hari_pengingat', 'template_pesan', 'template_nagih', 'gateway', 'jam_kirim', 'nomor_rekap',
    'rekap_aktif', 'backup_drive', 'kuota_harian', 'eskalasi_setelah',
    'template_eskalasi', 'template_rekap', 'preset_chat', 'auto_beres', 'laporan_bulan_aktif'].forEach(function (k) {
    if (obj[k] !== undefined && obj[k] !== null) p.setProperty(k, String(obj[k]));
  });
  if (obj.api_key !== undefined && String(obj.api_key).trim() !== '') p.setProperty('api_key', String(obj.api_key).trim());
  return getSettings();
}

// Kunci simpan khusus template: kosong = jangan timpa yang lama.
function simpanTemplate(obj) {
  var bersih = {};
  ['template_pesan', 'template_nagih', 'template_eskalasi', 'template_rekap'].forEach(function (k) {
    if (obj && obj[k] !== undefined && String(obj[k]).trim() !== '') bersih[k] = String(obj[k]);
  });
  // Preset chat boleh dikosongkan total (tombolnya memang mau dihilangkan).
  if (obj && obj.preset_chat !== undefined) bersih.preset_chat = String(obj.preset_chat);
  if (!Object.keys(bersih).length) throw new Error('Template-nya kosong, tidak jadi disimpan.');
  return saveSettings(bersih);
}

function isiTpl(tpl, map) {
  var out = String(tpl === undefined || tpl === null || String(tpl).trim() === '' ? '' : tpl);
  Object.keys(map).forEach(function (k) { out = out.split('{' + k + '}').join(map[k]); });
  return out;
}

function hariPengingat() {
  return String(getSettings().hari_pengingat).split(',').map(function (s) { return parseInt(s.trim(), 10); })
    .filter(function (n) { return !isNaN(n); });
}

function todayYMD() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }

function ymdParts(s) {
  var m = String(s).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function parseToYMD(v) {
  if (v === null || v === undefined || v === '') return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  var s = String(v).trim();
  if (ymdParts(s)) return s;
  var d = new Date(s);
  if (!isNaN(d.getTime())) return Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
  return s;
}

function sisaHari(v, today) {
  var ymd = parseToYMD(v);
  var p = ymdParts(ymd);
  if (!p) return null;
  var t = today ? ymdParts(today) : ymdParts(todayYMD());
  var target = Date.UTC(p[0], p[1] - 1, p[2]);
  var base = Date.UTC(t[0], t[1] - 1, t[2]);
  return Math.round((target - base) / 86400000);
}

function kategoriDari(v, today) {
  var ymd = parseToYMD(v);
  if (ymd === '' || !ymdParts(ymd)) return 'belum';
  var s = sisaHari(ymd, today);
  if (s === null) return 'belum';
  if (s < 0) return 'hangus';
  if (s <= 3) return 'kritis';
  if (s <= 7) return 'segera';
  return 'aman';
}

function bacaNomor() {
  var sh = sheetNomor();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, HEAD_NOMOR.length).getValues();
  var today = todayYMD();
  return vals.map(function (r, i) {
    return {
      row: i + 2,
      id: r[0],
      nomor: String(r[1] || ''),
      operator: String(r[2] || ''),
      tgl_tenggang: parseToYMD(r[3]),
      penanggungjawab: String(r[4] || ''),
      catatan: String(r[6] || ''),
      status_tindak: String(r[7] || ''),
      mulai_diinget: String(r[8] || ''),
      umur_diinget: String(r[8] || '') ? selisihHari(parseToYMD(r[8]), today) : null,
      dibuat: r[5] ? Utilities.formatDate(new Date(r[5]), TZ, 'yyyy-MM-dd HH:mm') : '',
      kategori: kategoriDari(r[3], today),
      sisa: sisaHari(r[3], today)
    };
  });
}

function nextId() {
  var rows = bacaNomor();
  var max = 0;
  rows.forEach(function (r) { var n = parseInt(r.id, 10); if (!isNaN(n) && n > max) max = n; });
  return max + 1;
}

function validasiNomor(n) {
  var d = String(n || '').replace(/[\s\-()]+/g, '');
  return /^(0|\+?62)[0-9]{7,14}$/.test(d);
}

function tambahNomor(obj) {
  if (!obj.nomor || !obj.operator) throw new Error('Nomor dan operator wajib diisi.');
  if (!validasiNomor(obj.nomor)) throw new Error('Nomor tidak valid. Harus 08xxx / 62xxx.');
  var tgl = parseToYMD(obj.tgl_tenggang);
  if (tgl !== '' && !ymdParts(tgl)) throw new Error('Tanggal tidak valid.');
  var nomor = normLokal(obj.nomor) || String(obj.nomor).trim();
  var sh = sheetNomor();
  sh.appendRow([nextId(), nomor, String(obj.operator).trim(), tgl,
    String(obj.penanggungjawab || ''), new Date(), String(obj.catatan || '').trim()]);
  sh.getRange(sh.getLastRow(), 2).setNumberFormat('@').setValue(nomor);
  return { ok: true };
}

function updateNomor(obj) {
  if (!validasiNomor(obj.nomor)) throw new Error('Nomor tidak valid.');
  var tgl = parseToYMD(obj.tgl_tenggang);
  if (tgl !== '' && !ymdParts(tgl)) throw new Error('Tanggal tidak valid.');
  var nomor = normLokal(obj.nomor) || String(obj.nomor).trim();
  var sh = sheetNomor();
  var r = cariRowById(obj.id);
  sh.getRange(r, 2, 1, 4).setValues([[nomor, String(obj.operator).trim(), tgl, String(obj.penanggungjawab || '')]]);
  sh.getRange(r, 2).setNumberFormat('@').setValue(nomor);
  sh.getRange(r, K.CATATAN).setValue(String(obj.catatan || '').trim());
  return { ok: true };
}

// Setelah pulsa diisi: simpan tanggal aktif baru + jejaknya di catatan.
function tandaiSudahDiisi(id, tglBaru) {
  var tgl = parseToYMD(tglBaru);
  if (!ymdParts(tgl)) throw new Error('Tanggal baru belum diisi.');
  var sh = sheetNomor();
  var r = cariRowById(id);
  var sisa = sisaHari(tgl);
  var catatan = String(sh.getRange(r, K.CATATAN).getValue() || '');
  var jejak = Utilities.formatDate(new Date(), TZ, 'dd MMM yyyy') + ': diisi pulsa, aktif s/d ' + formatTanggalId(tgl);
  sh.getRange(r, 4).setValue(tgl);
  sh.getRange(r, K.CATATAN).setValue(catatan ? catatan + '\n' + jejak : jejak);
  sh.getRange(r, K.STATUS).setValue('beres');
  sh.getRange(r, K.MULAI).setValue('');
  return { ok: true, tgl: tgl, sisa: sisa };
}

// Status kerja per nomor: perlu | proses | beres | '' (kosong = belum perlu ditindak).
function setStatusTindak(id, status) {
  if (STATUS_TINDAK.indexOf(status) === -1 && status !== '') throw new Error('Status tidak dikenal.');
  var sh = sheetNomor();
  var r = cariRowById(id);
  sh.getRange(r, K.STATUS).setValue(status);
  if (status === 'perlu') { if (!String(sh.getRange(r, K.MULAI).getValue() || '')) sh.getRange(r, K.MULAI).setValue(todayYMD()); }
  else if (status !== 'proses') sh.getRange(r, K.MULAI).setValue('');
  return { ok: true, status: status };
}

function setStatusTindakTerpilih(ids, status) {
  var diubah = 0;
  (ids || []).forEach(function (id) {
    try { setStatusTindak(id, status); diubah++; } catch (e) { }
  });
  return { diubah: diubah, status: status };
}

function hapusNomor(id) {
  var r = cariRowById(id);
  sheetNomor().deleteRow(r);
  return { ok: true };
}

function cariRowById(id) {
  var found = bacaNomor().filter(function (x) { return String(x.id) === String(id); });
  if (!found.length) throw new Error('Nomor tidak ditemukan.');
  return found[0].row;
}

function getDashboard() {
  var rows = isiStatusOtomatis(bacaNomor());
  var diinget = mapDiingetHariIni();
  rows.forEach(function (r) { r.diinget = diinget[normLokal(r.nomor)] || null; });
  var stats = { total: 0, aman: 0, segera: 0, kritis: 0, hangus: 0, belum: 0, perlu: 0, proses: 0, beres: 0, tunggak: 0 };
  var today = todayYMD();
  var ambangEsk = Math.max(1, parseInt(getSettings().eskalasi_setelah, 10) || 3);
  rows.forEach(function (r) {
    stats[r.kategori] = (stats[r.kategori] || 0) + 1;
    if (r.status_efektif) stats[r.status_efektif] = (stats[r.status_efektif] || 0) + 1;
    if (r.mulai_diinget && r.status_efektif !== 'beres' && selisihHari(r.mulai_diinget, today) >= ambangEsk) stats.tunggak++;
  });
  stats.total = rows.length;
  var dipantau = rows.filter(function (r) { return r.kategori !== 'hangus'; });
  var hangus = rows.filter(function (r) { return r.kategori === 'hangus'; });
  var ops = {}; rows.forEach(function (r) { if (r.operator) ops[r.operator] = 1; });
  return { stats: stats, dipantau: dipantau, hangus: hangus, operators: Object.keys(ops).sort(), settings: getSettings(), jadwal: triggerInfo(), hariIni: todayYMD() };
}

function mapDiingetHariIni() {
  var sh = sheetLog(); var last = sh.getLastRow(); var today = todayYMD(); var set = {};
  if (last < 2) return set;
  var vals = sh.getRange(2, 1, last - 1, HEAD_LOG.length).getValues();
  vals.forEach(function (r) {
    var w = Utilities.formatDate(new Date(r[0]), TZ, 'yyyy-MM-dd');
    if (w === today) set[normLokal(r[1])] = r[3];
  });
  return set;
}

// Tanggal terakhir nomor itu membalas WA (dari Log jenis "masuk").
function mapBalasanMasuk() {
  var sh = sheetLog(); var last = sh.getLastRow(); var set = {};
  if (last < 2) return set;
  var vals = sh.getRange(2, 1, last - 1, HEAD_LOG.length).getValues();
  vals.forEach(function (r) {
    if (String(r[6] || 'reminder') !== 'masuk') return;
    var w = Utilities.formatDate(new Date(r[0]), TZ, 'yyyy-MM-dd');
    var nm = normLokal(r[1]);
    if (!set[nm] || w > set[nm]) set[nm] = w;
  });
  return set;
}

// Status tindak lanjut tanpa diketik: sudah diinget = perlu, ada balasan = proses.
// Kolom status_tindak di Sheet tidak pernah ditimpa - status_manual tetap menang.
function isiStatusOtomatis(rows) {
  var balasan = mapBalasanMasuk();
  var hp = hariPengingat();
  var hMax = hp.length ? Math.max.apply(null, hp) : 7;
  rows.forEach(function (r) {
    r.balasan = balasan[normLokal(r.nomor)] || '';
    var auto = '';
    if (r.mulai_diinget && r.sisa !== null && r.sisa >= 0 && r.sisa <= hMax) {
      auto = (r.balasan && r.balasan >= r.mulai_diinget) ? 'proses' : 'perlu';
    }
    r.status_auto = auto;
    r.status_efektif = r.status_tindak || auto;
  });
  return rows;
}

function getDetailNomor(id) {
  var row = isiStatusOtomatis(bacaNomor()).filter(function (x) { return String(x.id) === String(id); })[0];
  if (!row) throw new Error('Nomor tidak ditemukan.');
  row.diinget = mapDiingetHariIni()[normLokal(row.nomor)] || null;
  var sh = sheetLog(); var last = sh.getLastRow(); var logs = [];
  if (last >= 2) {
    var vals = sh.getRange(2, 1, last - 1, HEAD_LOG.length).getValues();
    vals.forEach(function (r) {
      if (normLokal(r[1]) === normLokal(row.nomor)) logs.push({ waktu: Utilities.formatDate(new Date(r[0]), TZ, 'yyyy-MM-dd HH:mm'), hari_ke: r[2], status: r[3], pesan: r[4], jenis: String(r[6] || 'reminder') });
    });
    logs.reverse();
  }
  var preview = row.tgl_tenggang ? formatPesan(getSettings().template_pesan, row) : '';
  return { nomor: row, riwayat: logs, pratinjau: preview };
}

// Cek kualitas isi tab Nomor: hal-hal yang bikin pengingat tidak jalan.
function cekKesehatanData() {
  var rows = isiStatusOtomatis(bacaNomor());
  var today = todayYMD();
  var temuan = { duplikat: [], tanpaTanggal: [], tanpaPic: [], nomorRusak: [] };
  var perNomor = {};
  rows.forEach(function (r) {
    var k = normLokal(r.nomor);
    (perNomor[k] = perNomor[k] || []).push(r);
    if (!validasiNomor(r.nomor)) temuan.nomorRusak.push({ id: r.id, nomor: r.nomor, operator: r.operator });
    if (!r.tgl_tenggang) temuan.tanpaTanggal.push({ id: r.id, nomor: r.nomor, operator: r.operator, pj: r.penanggungjawab });
    if (!String(r.penanggungjawab || '').trim()) temuan.tanpaPic.push({ id: r.id, nomor: r.nomor, operator: r.operator });
  });
  Object.keys(perNomor).forEach(function (k) {
    if (perNomor[k].length > 1 && k) {
      temuan.duplikat.push({
        nomor: k, jumlah: perNomor[k].length,
        ids: perNomor[k].map(function (r) { return r.id; }),
        tanggal: perNomor[k].map(function (r) { return r.tgl_tenggang || '-'; }),
        salin: perNomor[k].map(function (r) { return { id: r.id, tgl: r.tgl_tenggang || '', pj: r.penanggungjawab || '', kategori: r.kategori || '' }; })
      });
    }
  });
  var bersih = temuan.duplikat.length + temuan.tanpaTanggal.length +
    temuan.tanpaPic.length + temuan.nomorRusak.length;
  return {
    hariIni: today,
    total: rows.length,
    temuan: temuan,
    masalah: bersih,
    skor: rows.length ? Math.round(100 - (bersih / rows.length) * 100) : 100
  };
}

function getLaporan() {
  var rows = bacaNomor();
  var statusCounts = { aman: 0, segera: 0, kritis: 0, hangus: 0, belum: 0 };
  rows.forEach(function (r) { statusCounts[r.kategori] = (statusCounts[r.kategori] || 0) + 1; });
  var totalLog = { terkirim: 0, 'dry-run': 0, gagal: 0, masuk: 0 };
  var sh = sheetLog(); var last = sh.getLastRow(); var map = {};
  var hariIni = todayYMD(); var days = [];
  for (var i = 29; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var ymd = Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
    days.push(ymd); map[ymd] = { terkirim: 0, 'dry-run': 0, gagal: 0 };
  }
  if (last >= 2) {
    var vals = sh.getRange(2, 1, last - 1, HEAD_LOG.length).getValues();
    vals.forEach(function (r) {
      var w = Utilities.formatDate(new Date(r[0]), TZ, 'yyyy-MM-dd');
      var st = String(r[3]);
      if (map[w] && map[w][st] !== undefined) map[w][st]++;
      if (w === hariIni && totalLog[st] !== undefined) totalLog[st]++;
    });
  }
  var series = days.map(function (d) { return { tgl: d, terkirim: map[d].terkirim, 'dry-run': map[d]['dry-run'], gagal: map[d].gagal }; });
  return { total: rows.length, statusCounts: statusCounts, hariIniCount: totalLog, series: series, hariIni: hariIni };
}

// Rekap untuk Excel. Baris "sep=;" memaksa pemisah titik-koma berapa pun
// pengaturan regional Excel, dan nomor ditulis sebagai ="08xxx" supaya angka
// nol di depannya tidak dimakan Excel.
function exportCsv() {
  var rows = isiStatusOtomatis(bacaNomor());
  var LABEL = { aman: 'Aman', segera: 'Segera berakhir', kritis: 'Kritis', hangus: 'Kedaluwarsa', belum: 'Belum diisi tanggal' };
  var TK = { perlu: 'Perlu ditindak', proses: 'Sedang diurus', beres: 'Beres' };
  var out = ['Nomor;Operator;Batas aktif;Sisa hari;Jatuh tempo;Penanggungjawab;Tindak lanjut;Catatan'];
  rows.forEach(function (r) {
    out.push([csvAman('="' + String(r.nomor || '') + '"'), r.operator || '', r.tgl_tenggang || '',
      (r.sisa === null || r.sisa === undefined ? '' : r.sisa), (LABEL[r.kategori] || r.kategori || ''),
      r.penanggungjawab || '', TK[r.status_efektif] || 'Belum ada', csvAman(r.catatan)].join(';'));
  });
  return { nama: 'rekap-nomor-tenggang-' + todayYMD() + '.csv', isi: '\uFEFF' + 'sep=;' + '\r\n' + out.join('\r\n') };
}

// Catatan / nomor formula bisa berisi tanda kutip, jadi perlu diapit kutip ganda.
function csvAman(v) {
  var s = String(v == null ? '' : v);
  if (!s) return '';
  return '"' + s.replace(/"/g, '""').replace(/\r?\n/g, ' | ') + '"';
}

// Laporan satu bulan untuk atasan: nomor habis di bulan itu + aktivitas WA bulan itu.
function getLaporanBulan(ym) {
  var bulan = String(ym || todayYMD()).substring(0, 7);
  var prefix = bulan + '-';
  var rows = bacaNomor().filter(function (r) { return r.tgl_tenggang.indexOf(prefix) === 0; });
  rows.sort(function (a, b) { return a.tgl_tenggang > b.tgl_tenggang ? -1 : 1; });
  var sh = sheetLog(); var last = sh.getLastRow();
  var aktivitas = { terkirim: 0, 'dry-run': 0, gagal: 0, masuk: 0, nomor_balas: {} };
  var perHari = {};
  if (last >= 2) {
    sh.getRange(2, 1, last - 1, HEAD_LOG.length).getValues().forEach(function (r) {
      var w = Utilities.formatDate(new Date(r[0]), TZ, 'yyyy-MM-dd');
      if (w.indexOf(prefix) !== 0) return;
      var st = String(r[3]);
      if (aktivitas[st] !== undefined) aktivitas[st]++;
      if (st === 'masuk') aktivitas.nomor_balas[normLokal(r[1])] = 1;
      perHari[w] = (perHari[w] || 0) + 1;
    });
  }
  return {
    bulan: bulan,
    hariIni: todayYMD(),
    jatuhTempo: rows.map(function (r) {
      return { nomor: r.nomor, operator: r.operator, tgl: r.tgl_tenggang, sisa: r.sisa, kategori: r.kategori, pj: r.penanggungjawab, catatan: r.catatan };
    }),
    aktivitas: aktivitas,
    totalNomorBalas: Object.keys(aktivitas.nomor_balas).length,
    jumlahHariAktif: Object.keys(perHari).length
  };
}

// Rekap harian buat atasan: apa yang masih perlu ditindak hari ini.
function getRekapHarian() {
  var rows = bacaNomor();
  var diinget = mapDiingetHariIni();
  var belum = [];
  var ringkas = { kritis: 0, segera: 0, aman: 0, hangus: 0, belum_tgl: 0, diinget: 0 };
  rows.forEach(function (r) {
    if (r.kategori === 'hangus') { ringkas.hangus++; return; }
    if (r.kategori === 'belum') { ringkas.belum_tgl++; return; }
    if (r.kategori === 'kritis') ringkas.kritis++;
    if (r.kategori === 'segera') ringkas.segera++;
    if (r.kategori === 'aman') ringkas.aman++;
    var hariKe = r.sisa;
    if (r.sisa !== null && hariPengingat().indexOf(r.sisa) !== -1) {
      ringkas.diinget++;
      if (diinget[normLokal(r.nomor)] !== 'terkirim') belum.push(r.nomor + ' (H-' + hariKe + ')');
    }
  });
  var w = getWaRingkas();
  var s = getSettings();
  var baris = [];
  baris.push('*Rekap Pengingat Nomor \u2014 ' + formatTanggalId(todayYMD()) + '*');
  baris.push('Total dipantau: ' + (rows.length - ringkas.hangus) + ' nomor');
  baris.push('Kritis (<=3 hari): ' + ringkas.kritis + ' | Segera (<=7 hari): ' + ringkas.segera);
  baris.push('Pengingat terjadwal hari ini: ' + ringkas.diinget + ' (sudah terkirim: ' + w.kirimHariIni + ')');
  if (belum.length) baris.push('Belum terkirim: ' + belum.join(', '));
  if (ringkas.belum_tgl) baris.push('Tanggal masa aktif belum diisi: ' + ringkas.belum_tgl);
  if (ringkas.hangus) baris.push('Sudah hangus (tidak dipantau): ' + ringkas.hangus);
  baris.push('Balasan masuk hari ini: ' + w.masukHariIni);
  var kuota = Math.max(0, parseInt(s.kuota_harian, 10) || 0);
  if (kuota > 0) baris.push('Kuota harian: ' + w.keluarHariIni + '/' + kuota + ' terpakai');
  if (w.nagihHariIni) baris.push('Pengingat ulang hari ini: ' + w.nagihHariIni);
  var ambangEsk = Math.max(1, parseInt(s.eskalasi_setelah, 10) || 3);
  var menunggak = rows.filter(function (r) {
    return r.mulai_diinget && r.status_tindak !== 'beres' && selisihHari(r.mulai_diinget, todayYMD()) >= ambangEsk;
  });
  if (menunggak.length) baris.push('Belum ada kabar setelah ' + ambangEsk + ' hari: ' + menunggak.length + ' nomor');
  if (w.gagal) baris.push('PENGINGAT GAGAL: ' + w.gagal + ' \u2014 perlu dicek');
  var badan = baris.slice(1).join('\n');
  var tpl = String(s.template_rekap || '').trim();
  var pesan = tpl ? isiTpl(tpl, { tanggal: formatTanggalId(todayYMD()), isi: badan }) : baris.join('\n');
  return { pesan: pesan, ringkas: ringkas, belum: belum, tujuan: s.nomor_rekap, hariIni: todayYMD() };
}

// dryRun = lihat isinya dulu tanpa kirim ke nomor atasan.
function kirimRekap(dryRun, tujuanOverride) {
  var r = getRekapHarian();
  var tujuan = String(tujuanOverride || getSettings().nomor_rekap || '').trim();
  if (!tujuan) throw new Error('Nomor rekap belum diisi di Pengaturan.');
  var k = dryRun ? { status: 'dry-run', respons: '' } : kirimWa(tujuan, r.pesan);
  catatLog(tujuan, '', k.status, r.pesan, k.respons, 'rekap');
  return { status: k.status, pesan: r.pesan, tujuan: tujuan };
}

// Laporan bulanan untuk atasan: ringkasan satu bulan penuh, terkirim otomatis tiap tanggal 1.
function kirimLaporanBulan(dryRun, ym) {
  var s = getSettings();
  var bulan = String(ym || '').trim();
  if (!/^\d{4}-\d{2}$/.test(bulan)) {
    var p = ymdParts(todayYMD());
    var tahun = p[0], bln = p[1] - 1;
    if (bln === 0) { tahun--; bln = 12; }
    bulan = tahun + '-' + ('0' + bln).slice(-2);
  }
  var lap = getLaporanBulan(bulan);
  var tujuan = String(s.nomor_rekap || '').trim();
  if (!tujuan) throw new Error('Nomor rekap belum diisi di Pengaturan.');
  var namaBulan = BULAN_ID[Number(bulan.substring(5, 7)) - 1] + ' ' + bulan.substring(0, 4);
  var baris = [];
  baris.push('*Laporan Bulanan Pengingat Nomor \u2014 ' + namaBulan + '*');
  baris.push('Nomor habis masa aktif: ' + lap.jatuhTempo.length);
  baris.push('Pengingat terkirim: ' + lap.aktivitas.terkirim);
  baris.push('Balasan masuk: ' + lap.aktivitas.masuk + ' (dari ' + lap.totalNomorBalas + ' nomor)');
  if (lap.aktivitas.gagal) baris.push('Gagal kirim: ' + lap.aktivitas.gagal + ' \u2014 perlu dicek');
  var pesan = baris.join('\n');
  var k = dryRun ? { status: 'dry-run', respons: '' } : kirimWa(tujuan, pesan);
  catatLog(tujuan, '', k.status, pesan, k.respons, 'laporan bulanan');
  return { status: k.status, pesan: pesan, tujuan: tujuan, bulan: bulan };
}

function triggerBulanan() {
  if (getSettings().laporan_bulan_aktif !== '1') return;
  try { kirimLaporanBulan(false); } catch (e) { Logger.log('Laporan bulanan gagal: ' + e); }
}

function backupData() {
  var log = []; var sh = sheetLog(); var last = sh.getLastRow();
  if (last >= 2) {
    var vals = sh.getRange(2, 1, last - 1, HEAD_LOG.length).getValues();
    log = vals.map(function (r) { return { waktu: r[0], nomor: r[1], hari_ke: r[2], status: r[3], pesan: r[4], respons: r[5] }; });
  }
  return { nama: 'backup-tenggang-' + todayYMD() + '.json', isi: JSON.stringify({ dibuat: new Date(), pengaturan: getSettings(), nomor: bacaNomor(), log: log }, null, 2) };
}

var FOLDER_BACKUP = 'Backup Nomor Tenggang';

// Simpan salinan data ke Google Drive (folder sendiri, satu file per hari).
function backupKeDrive() {
  var data = backupData();
  var folder = cariFolderBackup();
  var ketemu = folder.getFilesByName(data.nama);
  var file = ketemu.hasNext() ? ketemu.next() : null;
  if (file) file.setContent(data.isi);
  else file = folder.createFile(data.nama, data.isi, 'application/json');
  var p = PropertiesService.getScriptProperties();
  p.setProperty('backup_terakhir', Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm'));
  return { ok: true, nama: data.nama, url: file.getUrl(), ukuran: data.isi.length };
}

function cariFolderBackup() {
  var it = DriveApp.getFoldersByName(FOLDER_BACKUP);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_BACKUP);
}

function infoBackup() {
  var p = PropertiesService.getScriptProperties();
  return { terakhir: p.getProperty('backup_terakhir') || '', folder: FOLDER_BACKUP, aktif: getSettings().backup_drive === '1' };
}

function parseCsvLine(line) {
  var out = []; var cur = ''; var q = false;
  for (var i = 0; i < line.length; i++) {
    var c = line.charAt(i);
    if (c === '"') { if (q && line.charAt(i + 1) === '"') { cur += '"'; i++; } else q = !q; }
    else if ((c === ',' || c === ';') && !q) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map(function (s) { return String(s).trim(); });
}

function previewImport(csvText) {
  var text = String(csvText || '').replace(/^\uFEFF/, '');
  var lines = text.split(/\r\n|\r|\n/).filter(function (l) { return l.trim() !== ''; });
  if (lines.length && /nomor/i.test(lines[0]) && /operator/i.test(lines[0])) lines.shift();
  var ada = {}; bacaNomor().forEach(function (r) { ada[normLokal(r.nomor)] = 1; });
  var parsed = lines.map(function (line) {
    var c = parseCsvLine(line);
    var nomor = normLokal(c[0]) || (c[0] || ''), operator = c[1] || '', tgl = c[2] || '', pj = c[3] || '';
    if (!nomor || !operator) return { ok: false, alasan: 'nomor/operator kosong', nomor: nomor, operator: operator, tgl: tgl, pj: pj };
    if (!validasiNomor(nomor)) return { ok: false, alasan: 'nomor tidak valid', nomor: nomor, operator: operator, tgl: tgl, pj: pj };
    var iso = parseToYMD(tgl);
    if (tgl !== '' && !ymdParts(iso)) return { ok: false, alasan: 'tanggal tidak valid', nomor: nomor, operator: operator, tgl: tgl, pj: pj };
    if (ada[nomor]) return { ok: false, alasan: 'nomor sudah ada', nomor: nomor, operator: operator, tgl: iso, pj: pj };
    return { ok: true, nomor: nomor, operator: operator, tgl: iso, pj: pj };
  });
  parsed.forEach(function (p) { if (p.ok) ada[p.nomor] = 1; });
  var valid = parsed.filter(function (p) { return p.ok; });
  return { rows: parsed, total: parsed.length, valid: valid.length, invalid: parsed.length - valid.length };
}

function commitImport(items) {
  var sh = sheetNomor(); var n = 0;
  (items || []).forEach(function (it) {
    if (!it || !it.nomor || !it.operator) return;
    var nomor = normLokal(it.nomor) || String(it.nomor).trim();
    sh.appendRow([nextId(), nomor, String(it.operator).trim(), parseToYMD(it.tgl), String(it.pj || ''), new Date()]);
    sh.getRange(sh.getLastRow(), 2).setNumberFormat('@').setValue(nomor);
    n++;
  });
  return { masuk: n };
}

function pratinjauContoh(template, ke) {
  var d = new Date(); d.setDate(d.getDate() + 7);
  var ymd = Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
  var sample = { nomor: '081234567890', operator: 'Telkomsel', tgl_tenggang: ymd, penanggungjawab: 'Vantri (Admin)', sisa: 7 };
  return formatPesan(template || getSettings().template_pesan, sample, ke || 1);
}

// Tombol "Isi template pengingat" di menu Kirim Pesan pakai template asli + nomor terpilih.
function pratinjauUntukNomor(nomor) {
  var nm = normLokal(String(nomor || ''));
  var row = bacaNomor().filter(function (x) { return normLokal(x.nomor) === nm; })[0];
  if (!row) throw new Error('Nomor itu belum ada di daftar, jadi tanggal aktifnya belum diketahui.');
  return formatPesan(getSettings().template_pesan, row);
}

function kirimSekarang(id, dryRun) {
  var row = bacaNomor().filter(function (x) { return String(x.id) === String(id); })[0];
  if (!row) throw new Error('Nomor tidak ditemukan.');
  var pesan = formatPesan(getSettings().template_pesan, row);
  var k = dryRun ? { status: 'dry-run', respons: '' } : kirimWa(row.nomor, pesan);
  catatLog(row.nomor, (row.sisa === null ? '' : row.sisa), k.status, pesan, k.respons, 'manual');
  return { nomor: row.nomor, status: k.status, pesan: pesan };
}

function kirimTerpilih(ids, dryRun) {
  var hasil = { diproses: 0, terkirim: 0, 'dry-run': 0, gagal: 0 };
  (ids || []).forEach(function (id) {
    var r = kirimSekarang(id, dryRun);
    hasil.diproses++; hasil[r.status] = (hasil[r.status] || 0) + 1;
  });
  return hasil;
}

function hapusTerpilih(ids) {
  var sh = sheetNomor();
  var rows = (ids || []).map(cariRowById).sort(function (a, b) { return b - a; });
  rows.forEach(function (r) { sh.deleteRow(r); });
  return { terhapus: rows.length };
}

function bulkUpdate(ids, fields) {
  fields = fields || {};
  var sh = sheetNomor();
  var rows = (ids || []).map(cariRowById);
  var terpasang = [];
  if (fields.operator) { var op = String(fields.operator).trim(); rows.forEach(function (r) { sh.getRange(r, 3).setValue(op); }); terpasang.push('operator'); }
  if (fields.tgl_tenggang) {
    var tgl = parseToYMD(fields.tgl_tenggang);
    if (!ymdParts(tgl)) throw new Error('Tanggal tidak valid.');
    rows.forEach(function (r) { sh.getRange(r, 4).setNumberFormat("@").setValue(tgl); }); terpasang.push('tanggal');
  }
  if (fields.penanggungjawab) { var pj = String(fields.penanggungjawab); rows.forEach(function (r) { sh.getRange(r, 5).setValue(pj); }); terpasang.push('penanggungjawab'); }
  if (!terpasang.length) throw new Error('Isi minimal satu kolom yang mau diubah.');
  return { updated: rows.length, kolom: terpasang };
}

function kirimTes(target) {
  if (!validasiNomor(target)) throw new Error('Nomor tes tidak valid.');
  var k = kirimWa(target, 'Halo, ini pesan TES dari aplikasi Pengingat Masa Aktif Nomor. (' + todayYMD() + ')');
  return k;
}

function kirimPesanBebas(target, pesan) {
  var bersih = String(target || '').replace(/\D+/g, '');
  if (bersih && bersih.charAt(0) !== '0' && bersih.indexOf('62') !== 0) bersih = '0' + bersih;
  var nomor = normLokal(bersih);
  if (!validasiNomor(nomor)) throw new Error('Nomor tidak valid: "' + String(target).trim() + '". Pakai format 08xxx / 62xxx.');
  pesan = String(pesan || '').trim();
  if (!pesan) throw new Error('Pesan tidak boleh kosong.');
  var k = kirimWa(nomor, pesan);
  catatLog(nomor, '-', k.status, pesan, k.respons, 'chat');
  return { status: k.status, respons: k.respons, nomor: nomor };
}

function getChatContacts() {
  var info = {}; var shN = sheetNomor(); var lN = shN.getLastRow();
  if (lN >= 2) shN.getRange(2, 1, lN - 1, HEAD_NOMOR.length).getValues().forEach(function (r) {
    var nm = normLokal(r[1]);
    if (nm && validasiNomor(nm)) info[nm] = { operator: String(r[2] || ''), pj: String(r[4] || '') };
  });
  var logMap = {};
  var sh = sheetLog(); var last = sh.getLastRow();
  if (last >= 2) sh.getRange(2, 1, last - 1, HEAD_LOG.length).getValues().forEach(function (r) {
    var nomor = normLokal(r[1]); if (!nomor || !validasiNomor(nomor)) return;
    if (!logMap[nomor]) { logMap[nomor] = { count: 0, inCount: 0, last: '', waktu: '', ts: 0, nama: '' }; }
    logMap[nomor].count++; logMap[nomor].last = String(r[4] || '');
    if (String(r[3]) === 'masuk') {
      logMap[nomor].inCount++;
      var cn = /nama:\s*([^|]+)/.exec(String(r[5] || ''));
      if (cn && !logMap[nomor].nama) logMap[nomor].nama = cn[1].trim();
    }
    var tanggal = new Date(r[0]); var ts = isNaN(tanggal.getTime()) ? 0 : tanggal.getTime();
    logMap[nomor].waktu = Utilities.formatDate(tanggal, TZ, 'dd MMM HH:mm');
    logMap[nomor].ts = Math.max(logMap[nomor].ts, ts);
  });
  Object.keys(info).forEach(function (nm) { if (!logMap[nm]) logMap[nm] = { count: 0, inCount: 0, last: '', waktu: '', ts: 0, nama: '' }; });
  var extra = petaKontakExtra();
  var daftar = Object.keys(logMap);
  daftar.sort(function (a, b) { return (logMap[b].ts - logMap[a].ts) || (a < b ? -1 : 1); });
  return daftar.map(function (nm) { var l = logMap[nm], i = info[nm] || {}; return { nomor: nm, operator: i.operator || '', pj: i.pj || '', nama: extra.nama[nm] || l.nama || '', arsip: !!extra.arsip[nm], last: l.last, waktu: l.waktu, count: l.count, inCount: l.inCount, terdaftar: !!info[nm] }; });
}

// Nama tampilan & arsip percakapan disimpan sebagai JSON di Script Properties — sheet tidak diubah.
function petaKontakExtra() {
  var p = PropertiesService.getScriptProperties();
  var nama = {}, arsip = {};
  try { nama = JSON.parse(p.getProperty('nama_kontak') || '{}') || {}; } catch (e) { nama = {}; }
  try { (JSON.parse(p.getProperty('kontak_arsip') || '[]') || []).forEach(function (n) { arsip[String(n)] = 1; }); } catch (e) { arsip = {}; }
  return { nama: nama, arsip: arsip };
}

function setNamaKontak(nomor, nama) {
  var nm = normLokal(nomor);
  if (!validasiNomor(nm)) throw new Error('Nomor tidak valid.');
  var p = PropertiesService.getScriptProperties();
  var map = petaKontakExtra().nama;
  var bersih = String(nama || '').trim().substring(0, 40);
  if (bersih) map[nm] = bersih; else delete map[nm];
  p.setProperty('nama_kontak', JSON.stringify(map));
  return { ok: true, nomor: nm, nama: bersih };
}

function arsipKontak(nomor, mauArsip) {
  var nm = normLokal(nomor);
  if (!validasiNomor(nm)) throw new Error('Nomor tidak valid.');
  var p = PropertiesService.getScriptProperties();
  var ada = Object.keys(petaKontakExtra().arsip);
  var i = ada.indexOf(nm);
  if (mauArsip) { if (i < 0) ada.push(nm); } else if (i >= 0) ada.splice(i, 1);
  p.setProperty('kontak_arsip', JSON.stringify(ada));
  return { ok: true, nomor: nm, arsip: !!mauArsip };
}

function getChatLog(nomor) {
  var sh = sheetLog(); var last = sh.getLastRow(); var out = [];
  var kunci = normLokal(nomor);
  if (last >= 2) sh.getRange(2, 1, last - 1, HEAD_LOG.length).getValues().forEach(function (r, i) {
    if (normLokal(r[1]) !== kunci) return;
    var status = String(r[3] || '');
    out.push({
      row: i + 2,
      waktu: Utilities.formatDate(new Date(r[0]), TZ, 'dd MMM yyyy HH:mm'),
      pesan: String(r[4] || ''), status: status,
      arah: status === 'masuk' ? 'in' : 'out'
    });
  });
  return out;
}

function hapusLogRow(row) {
  var sh = sheetLog(); var last = sh.getLastRow(); var n = parseInt(row, 10);
  if (!(n >= 2 && n <= last)) throw new Error('Entri tidak ditemukan.');
  sh.deleteRow(n);
  return { deleted: n };
}

function hapusLogTerpilih(rows) {
  var sh = sheetLog(); var last = sh.getLastRow();
  var target = [];
  (rows || []).forEach(function (r) {
    var n = parseInt(r, 10);
    if (n >= 2 && n <= last && target.indexOf(n) < 0) target.push(n);
  });
  target.sort(function (a, b) { return b - a; });
  target.forEach(function (n) { sh.deleteRow(n); });
  return { terhapus: target.length };
}

// Balasan dobel: nomor + isi sama tercatat lebih dari sekali dalam 3 menit.
function petaDobelanMasuk() {
  var sh = sheetLog(); var last = sh.getLastRow();
  var out = { baris: [], kandidat: 0 };
  if (last < 2) return out;
  var vals = sh.getRange(2, 1, last - 1, HEAD_LOG.length).getValues();
  var terakhir = {};
  vals.forEach(function (r, i) {
    if (String(r[3] || '') !== 'masuk') return;
    var nm = normLokal(r[1]); var ps = String(r[4] || '').trim();
    var t = new Date(r[0]).getTime();
    if (!nm || isNaN(t)) return;
    var k = nm + '\u0001' + ps;
    if (terakhir[k] && (t - terakhir[k]) <= 3 * 60 * 1000) out.baris.push(i + 2);
    else terakhir[k] = t;
  });
  out.kandidat = out.baris.length;
  return out;
}

function bersihkanDobelan(dryRun) {
  var d = petaDobelanMasuk();
  if (dryRun) return { kandidat: d.kandidat, terhapus: 0 };
  var sh = sheetLog();
  d.baris.sort(function (a, b) { return b - a; }).forEach(function (n) { sh.deleteRow(n); });
  return { kandidat: d.baris.length, terhapus: d.baris.length };
}

function hapusChatNomor(nomor) {  var kunci = normLokal(nomor);
  if (!kunci) throw new Error('Nomor tidak valid.');
  var sh = sheetLog(); var last = sh.getLastRow(); var baris = [];
  if (last >= 2) sh.getRange(2, 2, last - 1, 1).getValues().forEach(function (r, i) {
    if (normLokal(r[0]) === kunci) baris.push(i + 2);
  });
  for (var i = baris.length - 1; i >= 0; i--) sh.deleteRow(baris[i]);
  return { deleted: baris.length, nomor: kunci };
}

// Menyimpan nomor balasan yang belum ada di daftar jadi entri Nomor.
function simpanKontakChat(nomor, nama) {
  var nm = normLokal(nomor);
  if (!validasiNomor(nm)) throw new Error('Nomor tidak valid.');
  if (cariDiNomor(nm)) return { ok: true, sudah: true, nomor: nm };
  var sh = sheetNomor();
  sh.appendRow([nextId(), nm, '', '', String(nama || '').trim(), new Date()]);
  sh.getRange(sh.getLastRow(), 2).setNumberFormat('@').setValue(nm);
  return { ok: true, nomor: nm };
}

function getRiwayatPage(page, size, st, q, tgl) {
  page = parseInt(page, 10) || 1; size = parseInt(size, 10) || 25;
  var sh = sheetLog(); var last = sh.getLastRow(); var all = [];
  if (last >= 2) {
    var vals = sh.getRange(2, 1, last - 1, HEAD_LOG.length).getValues();
    all = vals.map(function (r, i) { return { row: i + 2, waktu: Utilities.formatDate(new Date(r[0]), TZ, 'yyyy-MM-dd HH:mm'), nomor: normLokal(r[1]), hari_ke: r[2], status: r[3], pesan: r[4], jenis: String(r[6] || 'reminder') }; }).reverse();
  }
  if (tgl) all = all.filter(function (x) { return String(x.waktu).substring(0, 10) === String(tgl); });
  if (st) all = all.filter(function (x) { return String(x.status) === String(st); });
  if (q) { var ql = String(q).toLowerCase(); all = all.filter(function (x) { return String(x.nomor).toLowerCase().indexOf(ql) !== -1; }); }
  var total = all.length; var start = (page - 1) * size;
  return { rows: all.slice(start, start + size), total: total, page: page, size: size, pages: Math.max(1, Math.ceil(total / size)) };
}

// Jejak terakhir jadwal berjalan, disimpan di Script Properties supaya dashboard bisa
// membuktikan reminder benar-benar aktif tanpa harus baca trigger.
function catatJalanan(hasil, sumber) {
  var p = PropertiesService.getScriptProperties();
  p.setProperty('jal_hasil', JSON.stringify({
    sumber: sumber || 'manual', diproses: hasil.diproses || 0, terkirim: hasil.terkirim || 0,
    dicatat: hasil['dry-run'] || 0, gagal: hasil.gagal || 0, pengingatUlang: hasil.nagih || 0,
    eskalasi: hasil.eskalasi || 0, tertahan: hasil.tertahan || 0
  }));
  p.setProperty('jal_terakhir', Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm'));
}

function gabungJalanan(tambahan) {
  var p = PropertiesService.getScriptProperties();
  var lama = {};
  try { lama = JSON.parse(p.getProperty('jal_hasil') || '{}'); } catch (e) { lama = {}; }
  Object.keys(tambahan).forEach(function (k) { lama[k] = tambahan[k]; });
  p.setProperty('jal_hasil', JSON.stringify(lama));
}

function bacaJalanan() {
  var p = PropertiesService.getScriptProperties();
  var h = {};
  try { h = JSON.parse(p.getProperty('jal_hasil') || '{}'); } catch (e) { h = {}; }
  h.terakhir = p.getProperty('jal_terakhir') || '';
  return h;
}

function triggerInfo() {
  var t = ScriptApp.getProjectTriggers(); var aktif = false; var bulanan = false;
  t.forEach(function (x) {
    if (x.getHandlerFunction() === 'triggerHarian') aktif = true;
    if (x.getHandlerFunction() === 'triggerBulanan') bulanan = true;
  });
  var b = infoBackup(); var j = bacaJalanan();
  return { aktif: aktif, bulanan: bulanan, jam: getSettings().jam_kirim, rekap: getSettings().rekap_aktif === '1', nomor_rekap: getSettings().nomor_rekap, backup_aktif: b.aktif, backup_terakhir: b.terakhir, backup_folder: b.folder, jalan: j };
}

function pasangTrigger() {
  var t = ScriptApp.getProjectTriggers();
  t.forEach(function (x) {
    if (x.getHandlerFunction() === 'triggerHarian' || x.getHandlerFunction() === 'triggerBulanan') ScriptApp.deleteTrigger(x);
  });
  var jam = getSettings().jam_kirim || '09:00';
  var h = parseInt(String(jam).split(':')[0], 10); if (isNaN(h)) h = 9;
  ScriptApp.newTrigger('triggerHarian').timeBased().atHour(h).everyDays(1).create();
  ScriptApp.newTrigger('triggerBulanan').timeBased().onDayOfMonth(1).atHour(h).create();
  return { aktif: true, bulanan: true, jam: jam };
}

function hapusTrigger() {
  var t = ScriptApp.getProjectTriggers();
  t.forEach(function (x) {
    if (x.getHandlerFunction() === 'triggerHarian' || x.getHandlerFunction() === 'triggerBulanan') ScriptApp.deleteTrigger(x);
  });
  return { aktif: false };
}

// Matikan gateway & lepas trigger harian (aplikasi tanpa kirim WA). Bisa dipanggil lewat /exec?matikanFonnte=1.
function migrasiTanpaFonnte() {
  PropertiesService.getScriptProperties().setProperty('gateway', 'none');
  hapusTrigger();
  var t = ScriptApp.getProjectTriggers();
  var triggerHarianSisa = t.filter(function (x) { return x.getHandlerFunction() === 'triggerHarian'; }).length;
  return { gateway: 'none', triggerHarianSisa: triggerHarianSisa, triggerTotal: t.length };
}

function formatPesan(template, r, ke) {
  var sisa = r.sisa === null ? '' : r.sisa;
  var tgl = r.tgl_tenggang ? formatTanggalId(r.tgl_tenggang) : '';
  var pic = String(r.penanggungjawab || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  return String(template)
    .split('{nomor}').join(r.nomor)
    .split('{operator}').join(r.operator)
    .split('{tgl}').join(tgl)
    .split('{sisa}').join(sisa)
    .split('{ke}').join(ke || '')
    .split('{pic}').join(pic !== '' ? ' ' + pic : '');
}

// Jarak hari antara dua tanggal yyyy-mm-dd (b >= a memberi angka positif).
function selisihHari(a, b) {
  var p = ymdParts(a), q = ymdParts(b);
  if (!p || !q) return 0;
  return Math.round((Date.UTC(q[0], q[1] - 1, q[2]) - Date.UTC(p[0], p[1] - 1, p[2])) / 86400000);
}

var BULAN_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function formatTanggalId(ymd) {
  var p = ymdParts(ymd);
  if (!p) return ymd;
  return p[2] + ' ' + BULAN_ID[p[1] - 1] + ' ' + p[0];
}

function normalisasiWa(nomor) {
  var d = String(nomor).replace(/\D+/g, '');
  if (d.charAt(0) === '0') d = '62' + d.substring(1);
  else if (d.indexOf('62') !== 0) d = '62' + d;
  return d;
}

// Bentuk nomor gaya sheet (08xxx) supaya kirim & balasan nyambung di riwayat.
function normLokal(nomor) {
  var d = String(nomor).replace(/\D+/g, '');
  if (!d) return '';
  if (d.indexOf('62') === 0) return '0' + d.substring(2);
  if (d.charAt(0) === '0') return d;
  return '0' + d;
}

function cariDiNomor(nomor) {
  var sh = sheetNomor(); var last = sh.getLastRow();
  if (last < 2) return null;
  var vals = sh.getRange(2, 2, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (normLokal(vals[i][0]) === nomor) return { row: i + 2, nomor: nomor };
  }
  return null;
}

// ---- WEBHOOK BALASAN (Fonnte -> Apps Script) ----
function doPost(e) {
  var hasil = simpanPesanMasuk(ambilDataWebhook(e));
  return ContentService.createTextOutput(JSON.stringify(hasil)).setMimeType(ContentService.MimeType.JSON);
}

function ambilDataWebhook(e) {
  var out = {};
  function rangkap(src) {
    if (!src || typeof src !== 'object') return;
    Object.keys(src).forEach(function (k) { out[String(k).toLowerCase()] = src[k]; });
  }
  if (e && e.parameter) rangkap(e.parameter);
  var raw = (e && e.postData && e.postData.contents) ? String(e.postData.contents) : '';
  if (raw) {
    var obj = null;
    try { obj = JSON.parse(raw); } catch (err) { obj = null; }
    if (obj && typeof obj === 'object') rangkap(Array.isArray(obj) ? obj[0] : obj);
    else raw.split('&').forEach(function (p) {
      var i = p.indexOf('='); if (i < 1) return;
      var k = String(p.substring(0, i)).toLowerCase();
      if (out[k] === undefined) {
        var v = p.substring(i + 1);
        try { v = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (err2) { }
        out[k] = v;
      }
    });
  }
  return out;
}

function simpanPesanMasuk(d) {
  var dari = d.nomor || d.sender || d.from || d.msisdn || d.phone || d.customernumber || '';
  var pesan = d.pesan || d.message || d.text || d.content || d.body || '';
  var nama = d.nama || d.sender_name || d.sendername || d.name || '';
  var nomor = normLokal(dari);
  if (!validasiNomor(nomor)) return { status: 'diabaikan', alasan: 'nomor tidak valid' };
  var kenal = !!cariDiNomor(nomor);
  var teks = String(pesan || '').trim() || '(pesan kosong)';
  if (sudahMasukBaru(nomor, teks)) return { status: 'duplikat', nomor: nomor };
  var cat = [];
  if (nama) cat.push('nama: ' + nama);
  if (!kenal) cat.push('di luar daftar');
  catatLog(nomor, '-', 'masuk', teks, cat.join(' | ') || 'webhook', 'masuk');
  var auto = kenal ? cobaAutoBeres(nomor, teks) : null;
  return { status: 'tersimpan', nomor: nomor, kenal: kenal, autoBeres: !!auto };
}

// Balasan konfirmasi ("sudah diisi", "beres", "oke", "baik", ...) dari nomor yang dikenal
// otomatis menandai nomor itu Beres, jadi pengingat ulang berhenti sendiri.
function cobaAutoBeres(nomor, teks) {
  if (getSettings().auto_beres !== '1') return null;
  var t = String(teks || '').toLowerCase().trim();
  if (!t || t.length > 60) return null;
  if (/belum|gagal|error|mahal|susah|lupa|nanti|besok/.test(t)) return null;
  var konfirmasi = /(sudah|suah|sdh|beres|selesai|done|diisi|dibeli|topup|top up|siap|mantap|sip|noted|catat|baik|makasih|terima kasih)/.test(t) ||
    /^(ok|oke|okey|y|ya|yess?|gas|siiiip|okey dokey)\b/.test(t);
  if (!konfirmasi) return null;
  var ketemu = cariDiNomor(nomor);
  if (!ketemu) return null;
  var sh = sheetNomor();
  var statusLama = String(sh.getRange(ketemu.row, K.STATUS).getValue() || '');
  if (statusLama === 'beres') return null;
  sh.getRange(ketemu.row, K.STATUS).setValue('beres');
  sh.getRange(ketemu.row, K.MULAI).setValue('');
  var jejak = Utilities.formatDate(new Date(), TZ, 'dd MMM yyyy HH:mm') + ': beres otomatis dari balasan "' + t.substring(0, 40) + '"';
  var catatan = String(sh.getRange(ketemu.row, K.CATATAN).getValue() || '');
  sh.getRange(ketemu.row, K.CATATAN).setValue(catatan ? catatan + '\n' + jejak : jejak);
  catatLog(nomor, '-', 'otomatis', 'Status jadi Beres karena balasan konfirmasi: ' + t, 'auto-beres', 'auto');
  return { ok: true, nomor: nomor };
}

// Fonnte kadang mengirim webhook yang sama berkali-kali untuk satu chat,
// jadi balasan dengan isi sama dari nomor sama dalam 3 menit dianggap dobel.
function sudahMasukBaru(nomor, teks) {
  var sh = sheetLog();
  var last = sh.getLastRow();
  if (last < 2) return false;
  var mulai = Math.max(2, last - 39);
  var batas = Date.now() - 3 * 60 * 1000;
  var rows = sh.getRange(mulai, 1, last - mulai + 1, HEAD_LOG.length).getValues();
  for (var i = rows.length - 1; i >= 0; i--) {
    var r = rows[i];
    if (String(r[6] || 'reminder') !== 'masuk') continue;
    if (normLokal(r[1]) !== nomor) continue;
    if (String(r[4] || '').trim() !== teks) continue;
    var w = new Date(r[0]).getTime();
    if (w >= batas) return true;
  }
  return false;
}

// Satu kali baca Log: dedup harian + hitung nagih per nomor + cek eskalasi hari ini.
function petaLog(today) {
  var sh = sheetLog();
  var last = sh.getLastRow();
  var out = { keluarHariIni: {}, nagihTgl: {}, jumlahKeluarHariIni: 0, eskalasiHariIni: false };
  if (last < 2) return out;
  sh.getRange(2, 1, last - 1, HEAD_LOG.length).getValues().forEach(function (r) {
    var w = Utilities.formatDate(new Date(r[0]), TZ, 'yyyy-MM-dd');
    var nm = normLokal(r[1]);
    var jenis = String(r[6] || 'reminder');
    if (jenis === 'eskalasi') { if (w === today) out.eskalasiHariIni = true; return; }
    if (jenis === 'masuk' || !nm) return;
    if (jenis === 'nagih') { (out.nagihTgl[nm] = out.nagihTgl[nm] || []).push(w); }
    if (w === today) { out.jumlahKeluarHariIni++; if (String(r[3]) !== 'gagal') out.keluarHariIni[nm] = true; }
  });
  return out;
}

function kirimWa(nomor, pesan) {
  var s = getSettings();
  var key = PropertiesService.getScriptProperties().getProperty('api_key') || '';
  if (s.gateway !== 'fonnte' || !key) return { status: 'dry-run', respons: '' };
  var res = UrlFetchApp.fetch('https://api.fonnte.com/send', {
    method: 'post',
    headers: { Authorization: key },
    payload: { target: normalisasiWa(nomor), message: pesan },
    muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  var body = res.getContentText();
  var ok = false;
  try {
    var j = JSON.parse(body);
    var det = String(j.detail || '');
    var err = /gagal|error|invalid|tidak valid|out of quota|limit|balance|blocked/i.test(det);
    ok = code === 200 && !err && (j.status == 200 || /success/i.test(det) || (j.id && String(j.id).length > 2));
  } catch (e) { ok = code === 200 && /success/i.test(body) && !/gagal|invalid/i.test(body); }
  return { status: ok ? 'terkirim' : 'gagal', respons: String(body).substring(0, 300) };
}

// Jalankan pengingat: (1) H terjadwal, (2) nagih harian yang belum beres, (3) eskalasi ke atasan.
function jalankanReminder(dryRun, sumber) {
  var rows = bacaNomor();
  var today = todayYMD();
  var hp = hariPengingat();
  var s = getSettings();
  var hMax = hp.length ? Math.max.apply(null, hp) : 7;
  var kuota = Math.max(0, parseInt(s.kuota_harian, 10) || 0);
  var eskAfter = Math.max(1, parseInt(s.eskalasi_setelah, 10) || 3);
  var peta = petaLog(today);
  var terpakai = peta.jumlahKeluarHariIni;
  var sh = sheetNomor();
  var hasil = {
    diproses: 0, terkirim: 0, 'dry-run': 0, gagal: 0, nagih: 0, eskalasi: 0, tertahan: 0,
    kuota: kuota, kuotaPakai: terpakai, tunggakan: 0, entri: []
  };

  function sisaKuota() { return kuota > 0 ? (kuota - terpakai) : 9999; }
  function mulaiSiklus(r) {
    if (r.mulai_diinget) return;
    sh.getRange(r.row, K.MULAI).setValue(today);
    r.mulai_diinget = today;
  }
  function kirim(r, pesan, hariKe, jenis) {
    var nm = normLokal(r.nomor);
    if (kuota > 0 && sisaKuota() <= 0) {
      hasil.tertahan++;
      hasil.entri.push({ nomor: r.nomor, hari_ke: hariKe, status: 'tertahan', jenis: jenis, pesan: pesan });
      return;
    }
    var k = dryRun ? { status: 'dry-run', respons: '' } : kirimWa(r.nomor, pesan);
    catatLog(r.nomor, hariKe, k.status, pesan, k.respons, jenis);
    terpakai++;
    peta.keluarHariIni[nm] = true;
    hasil.diproses++;
    hasil[k.status] = (hasil[k.status] || 0) + 1;
    if (jenis === 'nagih') hasil.nagih++;
    hasil.entri.push({ nomor: r.nomor, hari_ke: hariKe, status: k.status, jenis: jenis, pesan: pesan });
  }

  rows.forEach(function (r) {
    if (r.sisa === null || hp.indexOf(r.sisa) === -1) return;
    if (peta.keluarHariIni[normLokal(r.nomor)]) return;
    mulaiSiklus(r);
    kirim(r, formatPesan(s.template_pesan, r), r.sisa, 'reminder');
  });

  rows.forEach(function (r) {
    if (r.sisa === null || r.sisa < 0 || r.sisa > hMax) return;
    if (r.status_tindak === 'beres' || r.status_tindak === 'proses') return;
    var nm = normLokal(r.nomor);
    if (peta.keluarHariIni[nm]) return;
    mulaiSiklus(r);
    var sudah = (peta.nagihTgl[nm] || []).filter(function (d) { return d >= r.mulai_diinget; }).length;
    kirim(r, formatPesan(s.template_nagih, r, sudah + 1), r.sisa, 'nagih');
  });

  var tunggak = rows.filter(function (r) {
    return r.mulai_diinget && r.status_tindak !== 'beres' && r.sisa !== null &&
      selisihHari(r.mulai_diinget, today) >= eskAfter;
  });
  hasil.tunggakan = tunggak.length;
  if (tunggak.length && s.nomor_rekap && !peta.eskalasiHariIni) {
    var isi = tunggak.map(function (r) {
      return '• ' + r.nomor + ' (' + (r.operator || '-') + ') — sisa ' + r.sisa + ' hari, diinget sejak ' + formatTanggalId(r.mulai_diinget);
    }).join('\n');
    var tplEsk = String(s.template_eskalasi || '').trim();
    var pesan = tplEsk ? isiTpl(tplEsk, { setelah: eskAfter, isi: isi, jumlah: tunggak.length })
      : 'NOMOR BELUM BERES\nSudah ' + eskAfter + ' hari diingetin, belum ada konfirmasi pengisian pulsa:\n' + isi +
      '\n\nTotal: ' + tunggak.length + ' nomor.';
    if (kuota <= 0 || sisaKuota() > 0) {
      var k = dryRun ? { status: 'dry-run', respons: '' } : kirimWa(s.nomor_rekap, pesan);
      catatLog(s.nomor_rekap, '', k.status, pesan, k.respons, 'eskalasi');
      terpakai++;
      hasil.eskalasi = tunggak.length;
      hasil.entri.push({ nomor: s.nomor_rekap, hari_ke: '-', status: k.status, jenis: 'eskalasi', pesan: pesan });
    } else {
      hasil.eskalasi = -tunggak.length;
    }
  }
  hasil.kuotaPakai = terpakai;
  catatJalanan(hasil, sumber);
  return hasil;
}

// arah: 'keluar' = pengingat yang dikirim, 'masuk' = balasan, kosong = semua.
function getRiwayat(limit, arah) {
  var sh = sheetLog();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, HEAD_LOG.length).getValues();
  var out = [];
  vals.forEach(function (r) {
    var status = String(r[3] || '');
    if (arah === 'masuk' && status !== 'masuk') return;
    if (arah === 'keluar' && status === 'masuk') return;
    out.push({ waktu: Utilities.formatDate(new Date(r[0]), TZ, 'yyyy-MM-dd HH:mm'), nomor: normLokal(r[1]), hari_ke: r[2], status: status, pesan: r[4], jenis: String(r[6] || 'reminder') });
  });
  return out.reverse().slice(0, limit || 50);
}

// Ringkasan aktivitas WA untuk tile kecil di dashboard.
function getWaRingkas() {
  var sh = sheetLog(); var last = sh.getLastRow();
  var out = {
    terkirim: 0, dryRun: 0, masuk: 0, gagal: 0, nagih: 0, eskalasi: 0,
    kirimHariIni: 0, keluarHariIni: 0, masukHariIni: 0, nagihHariIni: 0, total: 0
  };
  if (last < 2) return out;
  var today = todayYMD();
  sh.getRange(2, 1, last - 1, HEAD_LOG.length).getValues().forEach(function (r) {
    var t = new Date(r[0]);
    var hari = isNaN(t.getTime()) ? '' : Utilities.formatDate(t, TZ, 'yyyy-MM-dd');
    var status = String(r[3] || '');
    var jenis = String(r[6] || 'reminder');
    out.total++;
    if (jenis === 'eskalasi') { out.eskalasi++; if (hari === today) out.keluarHariIni++; return; }
    if (status === 'masuk') { out.masuk++; if (hari === today) out.masukHariIni++; return; }
    if (jenis === 'nagih') { out.nagih++; if (hari === today) out.nagihHariIni++; }
    if (status === 'gagal') out.gagal++;
    else if (status === 'dry-run') out.dryRun++;
    else out.terkirim++;
    if (hari === today) {
      out.keluarHariIni++;
      if (status === 'terkirim') out.kirimHariIni++;
    }
  });
  return out;
}

// Sekali jalan: kembalikan angka 0 di depan nomor lama di tab Log.
function bereskanNomorLog() {
  var sh = sheetLog(); var last = sh.getLastRow(); var diperbaiki = 0, rusak = [];
  if (last < 2) return { diperbaiki: 0, rusak: rusak };
  var range = sh.getRange(2, 2, last - 1, 1);
  var vals = range.getValues();
  var berubah = false;
  vals.forEach(function (r, i) {
    var aslinya = String(r[0] || '').trim();
    if (!aslinya) return;
    if (/[^0-9]/.test(aslinya)) { rusak.push({ row: i + 2, nilai: aslinya }); return; }
    var baik = normLokal(aslinya);
    if (!baik) { rusak.push({ row: i + 2, nilai: aslinya }); return; }
    if (aslinya !== baik) { vals[i][0] = baik; berubah = true; diperbaiki++; }
    else vals[i][0] = baik;
  });
  if (berubah) { range.setNumberFormat('@'); range.setValues(vals); }
  return { diperbaiki: diperbaiki, rusak: rusak, totalBaris: last - 1 };
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.nomor || p.sender) {
    // link /exec?nomor=... dipakai Fonnte sebagai webhook balasan (versi GET)
    var hasil = simpanPesanMasuk(ambilDataWebhook(e));
    return ContentService.createTextOutput(JSON.stringify(hasil)).setMimeType(ContentService.MimeType.JSON);
  }
  if (p.diagnosa && bolehBukaDashboard(p)) {
    return ContentService.createTextOutput(JSON.stringify(diagnosa())).setMimeType(ContentService.MimeType.JSON);
  }
  if (p.bereskanNomor && bolehBukaDashboard(p)) {
    return ContentService.createTextOutput(JSON.stringify(bereskanNomorLog())).setMimeType(ContentService.MimeType.JSON);
  }
  if (p.matikanFonnte && bolehBukaDashboard(p)) {
    return ContentService.createTextOutput(JSON.stringify(migrasiTanpaFonnte())).setMimeType(ContentService.MimeType.JSON);
  }
  if (p.pj) {
    var namaPj = pjCariNama(p.pj);
    if (!namaPj) {
      return HtmlService.createHtmlOutput(
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<div style="font-family:system-ui,sans-serif;padding:48px 24px;text-align:center;color:#334155">' +
        '<h3>Tautan tidak dikenal</h3><p>Hubungi admin untuk mendapat tautan baru.</p></div>'
      );
    }
    var tplPj = HtmlService.createTemplateFromFile('pj');
    tplPj.token = String(p.pj);
    return tplPj.evaluate()
      .setTitle('Nomor Saya')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  if (p.tautanPj && bolehBukaDashboard(p)) {
    return ContentService.createTextOutput(JSON.stringify(daftarTautanPj())).setMimeType(ContentService.MimeType.JSON);
  }
  if (!bolehBukaDashboard(p)) {
    return HtmlService.createHtmlOutput(
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<div style="font-family:system-ui,sans-serif;padding:48px 24px;text-align:center;color:#334155">' +
      '<h3>Dashboard terkunci</h3><p> Buka lewat URL khusus aplikasi ini (yang ada kode kuncinya), bukan URL ini langsung.</p></div>'
    );
  }
  return HtmlService.createTemplateFromFile('index').evaluate()
    .setTitle('Pengingat Masa Aktif Nomor')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Dashboard cuma bisa dibuka pakai kode kunci di URL (atau oleh pemiliknya sendiri).
var KUNCI_CADANGAN = 'pengingat2026';
function bolehBukaDashboard(p) {
  var k = String((p && p.kunci) || '');
  if (k && (k === getDashboardKunci() || k === KUNCI_CADANGAN)) return true;
  return pemilikSah();
}

function getDashboardKunci() {
  var prop = PropertiesService.getScriptProperties();
  var k = prop.getProperty('kunci_dashboard');
  if (!k) {
    k = Utilities.getUuid().replace(/-/g, '').substring(0, 12);
    prop.setProperty('kunci_dashboard', k);
  }
  return k;
}

// ---- LOGIN: password + token sesi 30 hari ----
// Password disimpan sebagai hash HMAC + salt (bukan teks asli). Token ditandatangani,
// jadi server nggak perlu nyimpen daftar sesi.
var SESI_MASA_KADALUASA = 30 * 24 * 60 * 60 * 1000;

function hexHmac(isi, kunci) {
  return Utilities.computeHmacSha256Signature(String(isi), String(kunci)).map(function (b) {
    return ('0' + (b & 255).toString(16)).slice(-2);
  }).join('');
}
function loginSalt() {
  var p = PropertiesService.getScriptProperties();
  var s = p.getProperty('login_salt');
  if (!s) { s = Utilities.getUuid().replace(/-/g, ''); p.setProperty('login_salt', s); }
  return s;
}
function loginHash(pass) { return hexHmac('pw|' + pass, loginSalt()); }
function loginSiapkan(passAwal) {
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty('login_hash')) return false;
  p.setProperty('login_hash', loginHash(passAwal));
  return true;
}
function loginCek(pass) {
  loginSiapkan(KUNCI_CADANGAN);
  if (loginHash(pass) !== PropertiesService.getScriptProperties().getProperty('login_hash')) {
    throw new Error('Password-nya belum cocok.');
  }
  return { token: tokenBuat(), sampai: Utilities.formatDate(new Date(Date.now() + SESI_MASA_KADALUASA), TZ, 'dd MMM yyyy') };
}
function loginGanti(passLama, passBaru) {
  loginSiapkan(KUNCI_CADANGAN);
  if (loginHash(passLama) !== PropertiesService.getScriptProperties().getProperty('login_hash')) {
    throw new Error('Password lama belum bener.');
  }
  if (String(passBaru || '').length < 6) throw new Error('Password baru minimal 6 karakter.');
  PropertiesService.getScriptProperties().setProperty('login_hash', loginHash(passBaru));
  return { ok: true };
}
function tokenBuat() {
  var ked = Date.now() + SESI_MASA_KADALUASA;
  return ked + '.' + hexHmac('sesi|' + ked, loginSalt());
}
function tokenSah(token) {
  var bag = String(token || '').split('.');
  if (bag.length !== 2) return false;
  var ked = Number(bag[0]);
  if (!ked || ked < Date.now()) return false;
  return hexHmac('sesi|' + ked, loginSalt()) === bag[1];
}
// Pemilik skrip yang buka pakai akun Google-nya sendiri langsung boleh masuk.
function jagaSesi(token) {
  if (pemilikSah()) return;
  if (tokenSah(token)) return;
  throw new Error('MASUK_DULU');
}

function pemilikSah() {
  var aktif = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!aktif) return false;
  return aktif === String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
}

function getWebhookUrl() {
  var url = ScriptApp.getService().getUrl();
  return { url: url, dashboardUrl: url + '?kunci=' + getDashboardKunci() };
}

// ---- TAUTAN KHUSUS PENANGGUNG JAWAB ----
// Tiap PJ punya URL sendiri (token = HMAC dari namanya), cuma bisa melihat
// dan menandai nomor miliknya sendiri, tanpa bisa membuka dashboard admin.
function normNama_(v) {
  return String(v || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
}

function pjToken(nama) {
  return hexHmac('pj|' + normNama_(nama), loginSalt()).substring(0, 10);
}

function pjCariNama(token) {
  var target = String(token || '').trim();
  if (!target) return '';
  var seen = {};
  var rows = bacaNomor();
  for (var i = 0; i < rows.length; i++) {
    var nm = normNama_(rows[i].penanggungjawab);
    if (!nm || seen[nm]) continue;
    seen[nm] = true;
    if (pjToken(rows[i].penanggungjawab) === target) return rows[i].penanggungjawab;
  }
  return '';
}

function daftarTautanPj() {
  var url = ScriptApp.getService().getUrl();
  var seen = {}; var out = [];
  var rows = bacaNomor();
  rows.forEach(function (r) {
    var nm = normNama_(r.penanggungjawab);
    if (!nm || seen[nm]) return;
    seen[nm] = true;
    out.push({ pj: r.penanggungjawab, jumlah: 0, url: url + '?pj=' + pjToken(r.penanggungjawab) });
  });
  var peta = {};
  rows.forEach(function (r) { var nm = normNama_(r.penanggungjawab); peta[nm] = (peta[nm] || 0) + 1; });
  out.forEach(function (x) { x.jumlah = peta[normNama_(x.pj)] || 0; });
  return out.sort(function (a, b) { return a.pj > b.pj ? 1 : -1; });
}

function pjList(token) {
  var nama = pjCariNama(token);
  if (!nama) throw new Error('Tautan tidak dikenal.');
  var rows = isiStatusOtomatis(bacaNomor()).filter(function (r) {
    return normNama_(r.penanggungjawab) === normNama_(nama);
  });
  return {
    nama: nama,
    hariIni: todayYMD(),
    rows: rows.map(function (r) {
      return { id: r.id, nomor: r.nomor, operator: r.operator, tgl: r.tgl_tenggang, sisa: r.sisa, kategori: r.kategori, status: r.status_efektif || '' };
    })
  };
}

// PJ konfirmasi sudah mengisi pulsa: pilih tanggal aktif baru, nomor jadi beres.
function pjIsi(token, id, tglBaru) {
  var nama = pjCariNama(token);
  if (!nama) throw new Error('Tautan tidak dikenal.');
  var r = cariRowById(id);
  var sh = sheetNomor();
  if (normNama_(String(sh.getRange(r, 5).getValue() || '')) !== normNama_(nama)) {
    throw new Error('Nomor itu bukan tanggung jawab Anda.');
  }
  var hasil = tandaiSudahDiisi(id, tglBaru);
  var nomor = String(sh.getRange(r, 2).getValue() || '');
  catatLog(nomor, '-', 'otomatis', 'Beres dikonfirmasi lewat tautan PJ (' + nama + '), aktif s/d ' + hasil.tgl, 'tautan-pj', 'auto');
  return hasil;
}

// Cek kondisi data dari jauh (dipakai buat benerin webhook).
function diagnosa() {
  var sh = sheetLog(); var last = sh.getLastRow();
  var masuk = 0, keluar = 0, sampel = [];
  if (last >= 2) {
    sh.getRange(2, 1, last - 1, HEAD_LOG.length).getValues().forEach(function (r) {
      if (String(r[3]) === 'masuk') {
        masuk++;
        sampel.push({ waktu: Utilities.formatDate(new Date(r[0]), TZ, 'dd MMM HH:mm'), nomor: String(r[1]), catatan: String(r[5] || '') });
      } else keluar++;
    });
  }
  var s = getSettings();
  return {
    nomorTerdaftar: Math.max(0, sheetNomor().getLastRow() - 1),
    totalLog: Math.max(0, last - 1),
    pesanMasuk: masuk,
    pesanKeluar: keluar,
    limaMasukTerakhir: sampel.slice(-5),
    gateway: s.gateway || 'none',
    adaApiKey: !!PropertiesService.getScriptProperties().getProperty('api_key'),
    jadwalAktif: (function () { var a = false; ScriptApp.getProjectTriggers().forEach(function (x) { if (x.getHandlerFunction() === 'triggerHarian') a = true; }); return a; })(),
    reminderTerakhir: bacaJalanan(),
    waktuServer: Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss')
  };
}

function include(namaFile) {
  return HtmlService.createHtmlOutputFromFile(namaFile).getContent();
}

function triggerHarian() {
  jalankanReminder(false, 'otomatis');
  var s = getSettings();
  var tambahan = { rekap: 'tidak aktif', backup: 'tidak aktif' };
  // Rekap & backup tetap jalan walau yang satu gagal.
  if (s.rekap_aktif === '1' && s.nomor_rekap) {
    try { kirimRekap(false); tambahan.rekap = 'terkirim'; } catch (e) { tambahan.rekap = 'gagal'; catatLog(s.nomor_rekap, '', 'gagal', 'Rekap harian gagal: ' + e.message, ''); }
  }
  if (s.backup_drive === '1') {
    try { backupKeDrive(); tambahan.backup = 'tersimpan'; } catch (e) { tambahan.backup = 'gagal'; Logger.log('Backup Drive gagal: ' + e); }
  }
  gabungJalanan(tambahan);
}