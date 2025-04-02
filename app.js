const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
});

// Create proxy middleware
const proxyMiddleware = createProxyMiddleware({
    target: 'http://3.137.223.39:3303',
    changeOrigin: true,
    pathRewrite: { '^/': '/' }, // Optional: keep paths as-is
    onProxyReq: (proxyReq, req, res) => {
        // Forward all headers from original request
        // (Authentication headers, content type, etc. will be preserved)
        console.log(`Proxying request to: ${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`Received response with status: ${proxyRes.statusCode}`);
    }
});

// Apply the proxy middleware to all routes
app.use('/', proxyMiddleware);

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});