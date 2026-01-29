const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db');

/*
  Ruta: /api/variedades
  Devuelve variedad + grupo
*/

// ===============================
// GET /api/variedades
// ===============================
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Base de datos no disponible'
      });
    }

    const result = await pool.request().query(`
      SELECT DISTINCT
        [DES_VARIEDADREAL] AS variedad,
        [DES_GRUPO]    AS grupo
      FROM [dbo].[Variedades]
      ORDER BY [DES_VARIEDADREAL]
    `);
    // Eliminamos espacios en blanco
    const cleanData = result.recordset.map(row => ({
      variedad: row.variedad.trim(),
      grupo: row.grupo.trim()
    }));

    res.json({
      success: true,
      data: cleanData
    });

  } catch (err) {
    console.error('❌ Error al obtener variedades:', err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener variedades',
      message: err.message
    });
  }
});

// ===============================
// GET /api/variedades/:nombre
// (opcional, por si lo necesitas)
// ===============================
router.get('/:nombre', async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('nombre', req.params.nombre)
      .query(`
        SELECT
          [DES_VARIEDADREAL] AS variedad,
          [DES_GRUPO]    AS grupo
        FROM [dbo].[Variedades]
        WHERE [DES_VARIEDADREAL] = @nombre
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Variedad no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });

  } catch (err) {
    console.error('❌ Error al obtener variedad:', err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener variedad',
      message: err.message
    });
  }
});

module.exports = router;
