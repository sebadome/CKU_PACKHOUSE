const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./db'); // ajusta la ruta si es distinta

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas existentes
app.use('/api/variedades', require('./routes/variedades'));
app.use('/api/auth', require('./routes/auth'));

// ------------------------------------------------------------
// NUEVAS RUTAS PARA AUTOCOMPLETE
// Huertos
app.get('/api/catalogo/autocomplete/huerto', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('q', `%${q}%`)
      .query(`
        SELECT DISTINCT Nombre_Huerto AS valor
        FROM dbo.CATALOGO2
        WHERE Nombre_Huerto LIKE @q
        ORDER BY Nombre_Huerto
      `);
    res.json(result.recordset.map(r => r.valor.trim()));
  } catch (err) {
    console.error('ERROR AUTOCOMPLETE HUERTO:', err);
    res.status(500).json([]);
  }
});

// Productores
app.get('/api/catalogo/autocomplete/productor', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('q', `%${q}%`)
      .query(`
        SELECT DISTINCT Nombre_Fantasia AS valor
        FROM dbo.CATALOGO2
        WHERE Nombre_Fantasia LIKE @q
        ORDER BY Nombre_Fantasia
      `);
    res.json(result.recordset.map(r => r.valor.trim()));
  } catch (err) {
    console.error('ERROR AUTOCOMPLETE PRODUCTOR:', err);
    res.status(500).json([]);
  }
});
// ------------------------------------------------------------

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Variedades funcionando' });
});

// Puerto
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT}`);
});
