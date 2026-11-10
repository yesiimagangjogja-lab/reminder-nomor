// Data CONTOH untuk preview lokal. Tidak dipakai aplikasi aslinya.
var CONTOH = {};

CONTOH.hariIni = '2026-10-10';
CONTOH.settings = {
  hari_pengingat: '14,7,3,1,0', jam_kirim: '09:00', gateway: 'fonnte', api_key_set: true,
  template_pesan: 'Halo{pic}, masa aktif nomor {nomor} ({operator}) akan berakhir pada {tgl} (sisa {sisa} hari). Mohon segera isi pulsa sebelum tanggal tersebut agar nomor tetap aktif. Terima kasih.',
  template_nagih: 'Halo{pic}, ini pengingat KE-{ke} untuk nomor {nomor} ({operator}). Masa aktifnya tinggal {sisa} hari ({tgl}) dan belum ada konfirmasi pengisian pulsa. Mohon segera diisi. Terima kasih.',
  template_eskalasi: 'NOMOR BELUM BERES\nSudah {setelah} hari diingetin, belum ada konfirmasi pengisian pulsa:\n{isi}\n\nTotal: {jumlah} nomor.',
  template_rekap: '*Rekap Pengingat Nomor — {tanggal}*\n{isi}',
  preset_chat: 'Halo, mohon jangan lupa isi pulsa nomornya ya.\nTes dari aplikasi pengingat nomor.',
  nomor_rekap: '081234500001', rekap_aktif: '1', backup_drive: '1', kuota_harian: '10', eskalasi_setelah: '3'
};

// 31 nomor CONTOH (data latihan preview, bukan data asli): 27 dipantau + 4 hangus.
// Kolom 7 = status tindak, kolom 8 = mulai diinget. Baris 15-26 sengaja dibikin kritis/segera
// biar kartu "Perlu Diurus" penuh dan bisa dites scroll-nya.
CONTOH.nomor = [
  ['081234567801', 'Telkomsel', '2026-10-12', 'Yesi', 'terkirim', '', 'perlu', '2026-10-07'],
  ['081234567802', 'Telkomsel', '2026-10-13', 'Rina', 'terkirim', '', 'proses', '2026-10-08'],
  ['085743615958', 'Telkomsel', '2026-10-14', 'Dwi', null, '05 Okt 2026: diisi pulsa 50rb oleh Dwi', 'beres', ''],
  ['081234567804', 'Indosat', '2026-10-16', 'Bagas', null, '', 'perlu', '2026-10-09'],
  ['081234567815', 'Telkomsel', '2026-10-10', 'CS Lili', null],
  ['081234567816', 'Indosat', '2026-10-10', 'CS Ayu', null],
  ['081234567817', 'XL', '2026-10-11', 'Kantor Pusat', null],
  ['081234567818', 'Three', '2026-10-11', 'Gudang', null],
  ['081234567819', 'AXIS', '2026-10-12', 'Toko A', null],
  ['081234567820', 'Smartfren', '2026-10-12', 'Toko B', null],
  ['081234567821', 'Telkomsel', '2026-10-13', 'CS Dini', null],
  ['081234567822', 'Indosat', '2026-10-13', 'CS Fika', null],
  ['081234567823', 'XL', '2026-10-14', 'Kantor Cabang', null],
  ['081234567824', 'Three', '2026-10-15', 'CS Wulan', null],
  ['081234567825', 'AXIS', '2026-10-16', 'CS Tia', null],
  ['081234567826', 'Smartfren', '2026-10-17', 'Gudang 2', null],
  ['081234567805', 'Indosat', '2026-10-20', 'Sari', null, 'Nomor pinjam bagian gudang'],
  ['081234567806', 'XL', '2026-10-25', 'Yoga', null],
  ['081234567807', 'XL', '2026-10-31', 'Mira', null],
  ['081234567808', 'AXIS', '2026-11-05', 'Tono', null],
  ['081234567809', 'AXIS', '2026-11-18', 'Lala', null],
  ['081234567810', 'Three', '2026-11-24', 'Fajar', null],
  ['081234567811', 'Three', '2026-12-02', 'Nina', null],
  ['081234567812', 'Smartfren', '2026-12-15', 'Riko', null],
  ['081234567813', 'Smartfren', '', 'Dila', null],
  ['081234567814', 'Telkomsel', '', '', null],
  ['081234567806', 'XL', '2026-10-25', 'Yoga', null],
  ['081234567891', 'Telkomsel', '2026-09-28', 'Kantor Pusat', null],
  ['081234567892', 'Indosat', '2026-09-15', 'Gudang', null],
  ['081234567893', 'XL', '2026-08-30', 'Toko A', null],
  ['081234567894', 'Three', '2026-08-02', '', null]
];

// Kolom waktu pakai format 'dd MMM yyyy HH:mm' agar sama dengan hasil server.
var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function jam(ymd, hm) {
  var p = ymd.split('-');
  return Number(p[2]) + ' ' + BULAN[Number(p[1]) - 1] + ' ' + p[0] + ' ' + hm;
}

CONTOH.log = [
  ['2026-10-10', '10:07', '085743615958', '-', 'terkirim', 'halo'],
  ['2026-10-10', '10:08', '085743615958', '-', 'masuk', 'iya'],
  ['2026-10-10', '10:08', '085743615958', '-', 'masuk', 'iya'],
  ['2026-10-10', '10:09', '085743615958', '-', 'masuk', 'iya'],
  ['2026-10-10', '09:57', '085743615958', '-', 'masuk', 'yaa'],
  ['2026-10-10', '09:12', '85788289813', '-', 'terkirim', 'halo'],
  ['2026-10-10', '09:07', '85788289813', '-', 'terkirim', 'Jawab pesan ini atau WhatsApp kamu akan ke hack'],
  ['2026-10-10', '08:55', '85640482885', '-', 'terkirim', 'halo'],
  ['2026-10-10', '08:30', '081234567801', '2', 'terkirim', 'Halo 081234567801 (Telkomsel), masa aktif habis 12 Okt 2026. Sisa 2 hari.'],
  ['2026-10-10', '08:30', '081234567802', '3', 'terkirim', 'Halo 081234567802 (Telkomsel), masa aktif habis 13 Okt 2026. Sisa 3 hari.'],
  ['2026-10-10', '08:30', '085743615958', '4', 'terkirim', 'Halo 085743615958 (Telkomsel), masa aktif habis 14 Okt 2026. Sisa 4 hari.'],
  ['2026-10-10', '08:30', '081234567804', '6', 'gagal', 'Halo 081234567804 (Indosat), masa aktif habis 16 Okt 2026. Sisa 6 hari.'],
  ['2026-10-10', '08:31', '081234567807', '21', 'terkirim', 'Pengingat KE-2 untuk 081234567807 (XL), sisa 21 hari.', 'nagih'],
  ['2026-10-09', '08:31', '081234567801', '3', 'terkirim', 'Pengingat KE-1 untuk 081234567801 (Telkomsel), sisa 3 hari.', 'nagih'],
  ['2026-10-09', '08:32', '081234500001', '-', 'terkirim', 'NOMOR BELUM BERES\n• 081234567801 — sisa 3 hari', 'eskalasi'],
  ['2026-10-09', '23:08', '85640482885', '-', 'dry-run', 'Jawab pesan ini atau WhatsApp kamu akan ke hack'],
  ['2026-10-09', '08:30', '081234567805', '11', 'terkirim', 'Halo 081234567805 (Indosat), sisa 11 hari.'],
  ['2026-10-08', '08:31', '081234567806', '17', 'terkirim', 'Halo 081234567806 (XL), sisa 17 hari.']
].map(function (l, i) {
  return {
    row: i + 2, ymd: l[0], hm: l[1], nomor: l[2], hari_ke: l[3], status: l[4], pesan: l[5],
    jenis: l[6] || 'reminder',
    waktu: jam(l[0], l[1])
  };
});
