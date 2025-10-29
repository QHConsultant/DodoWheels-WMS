const express = require('express');
const path = require('path');
const apiHandler = require('./api'); // This is the Express app from api/index.js

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount the API handler at the '/api' route.
// This is the standard pattern and mimics Vercel's rewrite behavior.
// A request to '/api/adjustments' will be sent to apiHandler as '/adjustments'.
app.use('/api', apiHandler);

// Serve static files from the React app
// This must point to the 'dist' folder as defined in package.json build script
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});