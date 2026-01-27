const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { poolPromise, sql } = require('../db');

const ROLES_VALIDOS = ['Administrador', 'TrabajadorCKU'];


/**
 * REGISTER
 */
router.post('/register', async (req, res) => {
  const { nombre, apellido, rut, email, planta, password, rol } = req.body;

  if (!nombre || !apellido || !rut || !email || !planta || !password || !rol) {
    return res.status(400).json({ message: 'Faltan campos' });
  }

  if (!ROLES_VALIDOS.includes(rol)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }

  try {
    const pool = await poolPromise;

    // 🔍 Verificar si existe RUT o EMAIL
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

    // 🔐 Hash password
    const hash = await bcrypt.hash(password, 10);

    // ✅ Insert
    await pool.request()
      .input('nombre', sql.VarChar(100), nombre)
      .input('apellido', sql.VarChar(100), apellido)
      .input('rut', sql.VarChar(12), rut)
      .input('email', sql.VarChar(200), email)
      .input('planta', sql.VarChar(100), planta)
      .input('hash', sql.VarChar, hash)
      .input('rol', sql.VarChar(50), rol)
      .query(`
        INSERT INTO dbo.CKU_Usuarios
        (nombre, apellido, rut, email, planta, password_hash, rol)
        VALUES
        (@nombre, @apellido, @rut, @email, @planta, @hash, @rol)
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
    const pool = await poolPromise;

    const result = await pool.request()
      .input('rut', sql.VarChar, rut)
      .query(`SELECT * FROM dbo.CKU_Usuarios WHERE rut = @rut`);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = result.recordset[0];
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // limpiara
    delete user.password_hash;

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: 'Error login' });
  }
});

module.exports = router;
