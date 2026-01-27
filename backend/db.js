require("dotenv").config();
const sql = require("mssql");

const config = {
  server: process.env.DB_SERVER,      // IP o hostname corporativo
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  options: {
    encrypt: true,                    // 🔐 recomendado en empresas
    trustServerCertificate: true,    // usa certificado válido
    enableArithAbort: true
  },

  pool: {
    max: 20,                          // mayor concurrencia
    min: 5,
    idleTimeoutMillis: 30000
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("✅ Conectado a SQL Server");
    return pool;
  })
  .catch(err => {
    console.error("❌ Error conexión SQL:", err);
    throw err;
  });

module.exports = { sql, poolPromise };
