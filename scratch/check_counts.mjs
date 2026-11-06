import { db } from '../server/database/db.js';

console.log('Users:', db.prepare('SELECT count(*) as c FROM users').get().c);
console.log('Berkas (Pendaftaran Ujian):', db.prepare('SELECT count(*) as c FROM pendaftaran_ujian').get().c);
console.log('Ujian Penguji:', db.prepare('SELECT count(*) as c FROM ujian_penguji').get().c);
console.log('Koreksi Penguji:', db.prepare('SELECT count(*) as c FROM koreksi_penguji').get().c);
console.log('Alokasi Ruangan:', db.prepare('SELECT count(*) as c FROM alokasi_ruangan').get().c);
console.log('SK Dokumen:', db.prepare('SELECT count(*) as c FROM sk_dokumen').get().c);
