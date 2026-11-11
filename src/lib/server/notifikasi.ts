import { q } from './db';

export type Notif = { jenis: 'baru' | 'tugas' | 'status' | 'petugas' | 'nilai'; judul: string; isi?: string; laporan_id: number };
type Klien = { query: (t: string, p?: unknown[]) => Promise<unknown> };

/** Kirim notifikasi ke banyak penerima; satu pesan per orang, pengirim sendiri tidak diberi. */
export async function kirim(penerima: Map<number, Notif>, pengirimId: number, klien?: Klien) {
  for (const [uid, n] of penerima) {
    if (uid === pengirimId) continue;
    const args = [uid, n.jenis, n.judul, n.isi ?? '', n.laporan_id];
    const sql = 'INSERT INTO notifikasi (user_id,jenis,judul,isi,laporan_id) VALUES ($1,$2,$3,$4,$5)';
    if (klien) await klien.query(sql, args);
    else await q(sql, args);
  }
}

export const idAdmin = async () => (await q<{ id: number }>(`SELECT id FROM users WHERE role='admin' AND aktif`)).map((r) => r.id);

export const jumlahBelumDibaca = async (uid: number) =>
  Number((await q<{ c: string }>('SELECT count(*) AS c FROM notifikasi WHERE user_id=$1 AND NOT dibaca', [uid]))[0].c);

/** Isi contoh dari data yang ada agar halaman notifikasi tidak kosong saat percobaan. */
export async function seedNotifikasi() {
  if (Number((await q<{ c: string }>('SELECT count(*) AS c FROM notifikasi'))[0].c) > 0) return;
  const ls = await q<any>('SELECT id,kode,judul,status,pelapor_id,petugas_id,created_at,updated_at FROM laporan ORDER BY created_at DESC');
  const ins = (u: number, jenis: string, judul: string, isi: string, l: number, dibaca: boolean, at: string) =>
    q('INSERT INTO notifikasi (user_id,jenis,judul,isi,laporan_id,dibaca,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [u, jenis, judul, isi, l, dibaca, at]);
  const adm = await idAdmin();
  let i = 0;
  for (const l of ls.slice(0, 12)) {
    for (const a of adm) await ins(a, 'baru', 'Laporan baru masuk', `${l.kode} · ${l.judul}`, l.id, i++ > 3, l.created_at);
    if (l.status !== 'Diterima') await ins(l.pelapor_id, 'status', `Status laporan Anda: ${l.status}`, `${l.kode} · ${l.judul}`, l.id, i % 3 === 0, l.updated_at);
    if (l.petugas_id) await ins(l.petugas_id, 'tugas', 'Tugas baru untuk Anda', `${l.kode} · ${l.judul}`, l.id, i % 2 === 0, l.updated_at);
  }
}
