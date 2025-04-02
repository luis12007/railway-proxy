const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Parse various content types
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.raw());

// Log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    next();
});

// Handle all requests
app.all('*', async(req, res) => {
    try {
        // Build target URL
        const targetUrl = `http://3.137.223.39:3303${req.url}`;
        console.log(`Forwarding to: ${targetUrl}`);

        // Configure the request
        const config = {
            method: req.method,
            url: targetUrl,
            headers: {
                ...req.headers,
                host: '3.137.223.39:3303'
            },
            data: req.body,
            validateStatus: () => true // Accept all status codes
        };

        // Log what we're sending
        console.log('Sending request with config:', JSON.stringify({
            method: config.method,
            url: config.url,
            headers: config.headers,
            data: config.data
        }, null, 2));

        // Forward the request
        const response = await axios(config);

        // Log the response
        console.log(`Response status: ${response.status}`);
        console.log(`Response headers: ${JSON.stringify(response.headers, null, 2)}`);

        // Forward response back to client
        res.status(response.status);

        // Forward response headers
        Object.keys(response.headers).forEach(header => {
            // Skip headers that Express handles
            if (!['transfer-encoding', 'connection'].includes(header.toLowerCase())) {
                res.setHeader(header, response.headers[header]);
            }
        });

        // Send response data
        res.send(response.data);

    } catch (error) {
        console.error('Proxy error:', error.message);
        if (error.response) {
            console.error('Response error data:', error.response.data);
        }
        res.status(500).send({ error: 'Proxy Error', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Simple proxy server running on port ${PORT}`);
});