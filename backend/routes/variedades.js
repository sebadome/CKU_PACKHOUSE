const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db');

/*
    NOTA (EN ESPAÑOL):
    - Esta ruta consulta la tabla que contiene las variedades.
    - Busque aquí los nombres de tabla/columna si necesita cambiarlos:
            - nombre de la tabla: aparece en la cláusula FROM (p. ej. 'manzana')
            - nombre de la columna: aparece en la lista SELECT o WHERE (p. ej. 'variedades')
    - Para encontrar rápidamente en el proyecto: busque 'variedades' o el nombre
        de la tabla actual dentro de `backend/routes`.
    - Si prefiere parametrizar, considere usar variables de entorno
        y centralizarlas en un módulo `backend/config.js`.
*/

// GET: Obtener todas las variedades para el dropdown
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        if (!pool) {
            return res.status(503).json({ 
                error: 'Base de datos no disponible' 
            });
        }

        const result = await pool.request()
            .query('SELECT DISTINCT [Des_Variedad] FROM [dbo].[CATALOGO2] ORDER BY [Des_Variedad]'); //volver a('SELECT DISTINCT [variedades] FROM [dbo].[manzana] ORDER BY [variedades]

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (err) {
        console.error('Error al obtener variedades:', err);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener variedades',
            message: err.message 
        });
    }
});

// GET: Obtener una variedad específica por nombre
router.get('/:nombre', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        if (!pool) {
            return res.status(503).json({ 
                error: 'Base de datos no disponible' 
            });
        }

        const result = await pool.request()
            .input('nombre', req.params.nombre)
            .query('SELECT * FROM [dbo].[CATALOGO2] WHERE [Des_Variedad] = @nombre');

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
        console.error('Error al obtener variedad:', err);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener variedad',
            message: err.message 
        });
    }
});


module.exports = router;