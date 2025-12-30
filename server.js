const path = require('path');
const express = require('express');

const app = express();

const rootDir = __dirname;
const indexPath = path.join(rootDir, 'index.html');

// Serve static files (CSS/JS/images/etc.)
app.use(express.static(rootDir, {
  fallthrough: true,
  etag: true,
  maxAge: '1h'
}));

// SPA-style fallback: always return index.html
app.get('*', (_req, res) => {
  res.sendFile(indexPath);
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Smart Schools landing listening on :${port}`);
});
