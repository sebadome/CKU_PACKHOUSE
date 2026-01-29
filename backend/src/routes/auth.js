const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { getPool, sql } = require('../db/pool');

const ROLES_VALIDOS = ['Administrador', 'Trabajador CKU'];

/**
 * REGISTER
 */
router.post('/register', async (req, res) => {
  const { name, apellido, rut, email, planta, password, roles } = req.body;

  if (!name || !apellido || !rut || !email || !planta || !password || !roles) {
    return res.status(400).json({ message: 'Faltan campos' });
  }

  if (!ROLES_VALIDOS.includes(roles)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }

  try {
    const pool = await getPool();

    const exists = await pool.request()
      .input('rut', sql.VarChar(12), rut)
      .input('email', sql.VarChar(200), email)
      .query(`
        SELECT rut, email
        FROM dbo.CKU_Usuarios
        WHERE rut = @rut OR email = @email
      `);

    if (exists.recordset.length > 0) {
      const encontrado = exists.recordset[0];

      if (encontrado.email === email) {
        return res.status(409).json({ message: 'Email ya registrado' });
      }
      if (encontrado.rut === rut) {
        return res.status(409).json({ message: 'RUT ya registrado' });
      }
    }

    const hash = await bcrypt.hash(password, 10);

    await pool.request()
      .input('name', sql.VarChar(100), name)
      .input('apellido', sql.VarChar(100), apellido)
      .input('rut', sql.VarChar(12), rut)
      .input('email', sql.VarChar(200), email)
      .input('planta', sql.VarChar(100), planta)
      .input('hash', sql.VarChar, hash)
      .input('roles', sql.VarChar(50), roles)
      .query(`
        INSERT INTO dbo.CKU_Usuarios
        (nombre, apellido, rut, email, planta, password_hash, rol)
        VALUES
        (@name, @apellido, @rut, @email, @planta, @hash, @roles)
      `);

    res.status(201).json({ message: 'Usuario creado' });

  } catch (err) {
    console.error('❌ ERROR REGISTER:', err);
    res.status(500).json({ message: 'Error servidor' });
  }
});

/**
 * LOGIN
 */
router.post('/login', async (req, res) => {
  const { rut, password } = req.body;
  console.log('LOGIN BODY:', req.body);

  try {
    const pool = await getPool();

    const result = await pool.request()
      .input('rut', sql.VarChar(12), rut)
      .query(`SELECT * FROM dbo.CKU_Usuarios WHERE rut = @rut`);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = result.recordset[0];
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    delete user.password_hash;

    res.json(user);

  } catch (err) {
    console.error('❌ ERROR LOGIN:', err);
    res.status(500).json({ message: 'Error login' });
  }
});

module.exports = router;
