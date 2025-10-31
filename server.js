const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// This server is now only for serving the static frontend files during local development.
// All API calls are made directly from the client to Supabase.

// Serve static files from the React app
// This must point to the 'dist' folder as defined in package.json build script
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Static file server is listening on port ${PORT}`);
});
