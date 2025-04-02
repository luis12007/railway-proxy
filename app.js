const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Important: Don't use body-parser for routes we're proxying
// as it will consume the request body

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);

    // Log the content-type and content-length for debugging
    console.log(`Content-Type: ${req.headers['content-type']}`);
    console.log(`Content-Length: ${req.headers['content-length']}`);

    next();
});

// Create proxy middleware with specific options to preserve the body
const proxyMiddleware = createProxyMiddleware({
    target: 'http://3.137.223.39:3303',
    changeOrigin: true,
    pathRewrite: { '^/': '/' },
    secure: false,
    // Don't parse the body, just forward it as is
    onProxyReq: (proxyReq, req, res) => {
        // If the original request has a body
        if (req.body && Object.keys(req.body).length > 0) {
            // Convert body object back to JSON string
            const bodyData = JSON.stringify(req.body);

            // Update content-length header
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));

            // Write body to request
            proxyReq.write(bodyData);
            proxyReq.end();
        } else if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 0) {
            // For raw bodies, we need a different approach
            // This ensures we don't lose the original body
            req.pipe(proxyReq);
        }

        console.log(`Proxying request to: ${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`Received response with status: ${proxyRes.statusCode}`);
    }
});

// Use a raw body parser for the /auth/login route (if needed)
app.use('/auth/login', express.raw({
    type: '*/*',
    limit: '10mb'
}));

// Apply the proxy middleware to all routes
app.use('/', proxyMiddleware);

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});