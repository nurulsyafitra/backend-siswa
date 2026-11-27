import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pool from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const FIELDS = ['kode_siswa', 'nama_siswa', 'alamat_siswa', 'tgl_lahir', 'jurusan'];

// Validasi: mengembalikan daftar field yang kosong
const validate = (body) =>
  FIELDS.filter((f) => !body[f] || String(body[f]).trim() === '');

app.get('/', (req, res) => res.json({ message: 'API Data Siswa berjalan' }));

// READ - semua siswa
app.get('/api/siswa', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM siswa ORDER BY kode_siswa');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data', error: err.message });
  }
});

// READ - satu siswa
app.get('/api/siswa/:kode', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM siswa WHERE kode_siswa = ?', [req.params.kode]);
    if (rows.length === 0) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data', error: err.message });
  }
});

// CREATE
app.post('/api/siswa', async (req, res) => {
  const kosong = validate(req.body);
  if (kosong.length) return res.status(400).json({ message: `Field wajib diisi: ${kosong.join(', ')}` });

  const { kode_siswa, nama_siswa, alamat_siswa, tgl_lahir, jurusan } = req.body;
  try {
    await pool.query(
      'INSERT INTO siswa (kode_siswa, nama_siswa, alamat_siswa, tgl_lahir, jurusan) VALUES (?, ?, ?, ?, ?)',
      [kode_siswa.trim(), nama_siswa.trim(), alamat_siswa.trim(), tgl_lahir, jurusan.trim()]
    );
    res.status(201).json({ message: 'Siswa berhasil ditambahkan' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Kode siswa sudah digunakan' });
    res.status(500).json({ message: 'Gagal menambah data', error: err.message });
  }
});

// UPDATE
app.put('/api/siswa/:kode', async (req, res) => {
  const { nama_siswa, alamat_siswa, tgl_lahir, jurusan } = req.body;
  if (!nama_siswa || !alamat_siswa || !tgl_lahir || !jurusan)
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  try {
    const [result] = await pool.query(
      'UPDATE siswa SET nama_siswa = ?, alamat_siswa = ?, tgl_lahir = ?, jurusan = ? WHERE kode_siswa = ?',
      [nama_siswa, alamat_siswa, tgl_lahir, jurusan, req.params.kode]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
    res.json({ message: 'Siswa berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui data', error: err.message });
  }
});

// DELETE
app.delete('/api/siswa/:kode', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM siswa WHERE kode_siswa = ?', [req.params.kode]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
    res.json({ message: 'Siswa berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus data', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));