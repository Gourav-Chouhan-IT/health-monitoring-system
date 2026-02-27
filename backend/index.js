const express = require('express');
const app = express();
const PORT = 3000;

// This is a basic route
app.get('/', (req, res) => {
  res.send('Hello! Your Express server is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});