const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log each request
app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Simple proxy handler for all routes
app.all('*', async(req, res) => {
    try {
        // Create target URL by replacing the base URL
        const targetUrl = `http://3.137.223.39:3303${req.url}`;
        console.log(`Forwarding to: ${targetUrl}`);

        // Forward the request using axios
        const response = await axios({
            method: req.method,
            url: targetUrl,
            headers: {
                ...req.headers,
                host: '3.137.223.39:3303'
            },
            data: req.body,
            responseType: 'arraybuffer', // Handle any response type
            validateStatus: () => true // Don't throw on non-2xx status
        });

        // Log response details
        console.log(`Response status: ${response.status}`);

        // Set response status
        res.status(response.status);

        // Set response headers
        for (const [key, value] of Object.entries(response.headers)) {
            // Skip headers that Express will set
            if (!['content-length', 'connection', 'transfer-encoding'].includes(key.toLowerCase())) {
                res.set(key, value);
            }
        }

        // Send response body
        res.send(response.data);

    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).send('Proxy Error: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Minimal proxy server running on port ${PORT}`);
});