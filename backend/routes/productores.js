const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db');

router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    if (!pool) return res.status(503).json({ success: false, error: 'BD no disponible' });

    const result = await pool.request().query(`
      SELECT DISTINCT [Nombre_Fantasia] AS productor
      FROM [dbo].[CATALOGO2]
      ORDER BY [Nombre_Fantasia]
    `);

    // Limpiamos espacios
    const productores = result.recordset.map(row => row.productor.trim());

    res.json({ success: true, data: productores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
