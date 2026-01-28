const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT DISTINCT [NombreFantasia] AS productor
      FROM [dbo].[CKU_Fruta_Productor]
      ORDER BY [NombreFantasia]
    `);

    const productores = result.recordset.map(row =>
      row.productor?.trim()
    );

    res.json({
      success: true,
      data: productores
    });

  } catch (err) {
    console.error('❌ Error productores:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
