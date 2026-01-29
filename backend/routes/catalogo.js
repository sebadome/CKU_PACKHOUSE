const express = require("express");
const router = express.Router();
const { poolPromise } = require("../db"); // ajusta la ruta si es distinta
const sql = require("mssql");

// Autocomplete Huertos
router.get("/autocomplete/huerto", async (req, res) => {
  const { q } = req.query;

  if (typeof q !== "string" || q.length < 2) {
    return res.json([]);
  }

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("q", `%${q}%`)
      .query(`
        SELECT DISTINCT Nombre_Huerto
        FROM dbo.CATALOGO2
        WHERE Nombre_Huerto LIKE @q
        ORDER BY Nombre_Huerto
      `);

    res.json(result.recordset.map(r => r.Nombre_Huerto.trim()));
  } catch (err) {
    console.error("ERROR AUTOCOMPLETE HUERTO:", err);
    res.status(500).json([]);
  }
});

// Autocomplete Productores
router.get("/autocomplete/productor", async (req, res) => {
  const { q } = req.query;

  if (typeof q !== "string" || q.length < 2) {
    return res.json([]);
  }

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("q", `%${q}%`)
      .query(`
        SELECT DISTINCT Nombre_Fantasia
        FROM dbo.CATALOGO2
        WHERE Nombre_Fantasia LIKE @q
        ORDER BY Nombre_Fantasia
      `);

    res.json(result.recordset.map(r => r.Nombre_Fantasia.trim()));
  } catch (err) {
    console.error("ERROR AUTOCOMPLETE PRODUCTOR:", err);
    res.status(500).json([]);
  }
});

module.exports = router;
