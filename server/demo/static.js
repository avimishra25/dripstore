const express = require('express');
const path = require('path');
const fs = require('fs');

module.exports = function serveDemoClient(app) {
  const root = path.resolve(__dirname, '../../client/build');
  if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Build the demo frontend before starting the hosted demo');
  app.use(express.static(root, { index: false }));
  app.get('*', (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/') || path.extname(req.path) || !req.accepts('html')) return next();
    res.sendFile(path.join(root, 'index.html'));
  });
};
