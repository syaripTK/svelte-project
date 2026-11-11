import bcrypt from 'bcryptjs';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgres://tanggap:tanggap@localhost:5433/tanggap' });
const akun = [
  ['zain@tanggap.id', 'Zain#tanggap2026'],
  ['glory@tanggap.id', 'Glory#tanggap2026'],
  ['iqbal@tanggap.id', 'Iqbal#tanggap2026']
];
for (const [email, pw] of akun) {
  const r = await pool.query('UPDATE users SET password=$1 WHERE email=$2', [await bcrypt.hash(pw, 10), email]);
  console.log(email, r.rowCount);
}
process.exit(0);
