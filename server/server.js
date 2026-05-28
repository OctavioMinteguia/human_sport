require('dotenv').config();
const app  = require('./app');
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`\n🚀 Human Sport corriendo en http://localhost:${port}`);
  console.log(`   Tienda:  http://localhost:${port}`);
  console.log(`   Admin:   http://localhost:${port}/admin`);
  console.log(`   API:     http://localhost:${port}/api/products\n`);
});
