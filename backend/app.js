const express = require('express');
const cors = require('cors');

const app = express();
 

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/variedades', require('./routes/variedades'));
app.use('/api/auth', require('./routes/auth'));

app.use('/api/catalogo', require('./routes/catalogo')); // Nueva ruta para huertos
 







// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: 'API de Variedades funcionando' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});