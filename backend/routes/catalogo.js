const express = require("express");
const router = express.Router();
const { poolPromise } = require("../db"); // ajusta la ruta si es distinta
const sql = require("mssql");

router.get("/autocomplete", async (req, res) => {
  const { campo, q } = req.query;

  if (campo !== "huerto") {
    return res.status(400).json({ error: "Campo no permitido" });
  }

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
        WHERE Nombre_Huerto  LIKE @q
        ORDER BY Nombre_Huerto
      `);

    res.json(result.recordset.map(r => r.Nombre_Huerto));
  } catch (err) {
    console.error("ERROR AUTOCOMPLETE:", err);
    res.status(500).json([]);
  }
});

module.exports = router;
