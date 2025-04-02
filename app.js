const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// Log middleware
app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    next();
});

// Middleware to handle authentication endpoints specifically
app.use('/auth/login', (req, res, next) => {
    // Force POST method for authentication endpoints
    if (req.method === 'GET' && req.headers['content-type'] === 'application/json') {
        console.log('Changing method from GET to POST for auth endpoint');
        req.method = 'POST';
    }
    next();
});

// Configure the proxy
const apiProxy = createProxyMiddleware({
    target: 'http://3.137.223.39:3303',
    changeOrigin: true,
    pathRewrite: { '^/': '/' },
    secure: false,
    onProxyReq: (proxyReq, req, res) => {
        // For POST/PUT/PATCH requests with JSON bodies
        if (['POST', 'PUT', 'PATCH'].includes(req.method) &&
            req.body &&
            Object.keys(req.body).length > 0) {

            const bodyData = JSON.stringify(req.body);
            // Update content-length
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.setHeader('Content-Type', 'application/json');

            // Write body data to the proxy request
            proxyReq.write(bodyData);
        }

        console.log(`Forwarding ${req.method} request to: ${proxyReq.path}`);
        console.log(`With headers: ${JSON.stringify(proxyReq.getHeaders(), null, 2)}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`Received ${proxyRes.statusCode} response from target`);
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy Error', message: err.message });
    }
});

// Parse JSON body for certain routes
app.use('/auth/login', express.json());

// Apply proxy to all routes
app.use('/', apiProxy);

// Start the server
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});