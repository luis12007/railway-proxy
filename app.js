const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Raw body parser middleware
const rawBodyParser = (req, res, next) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });

    req.on('end', () => {
        if (data) {
            // Store raw body
            req.rawBody = data;

            // Try to parse as JSON if content-type is json
            if (req.headers['content-type'] &&
                req.headers['content-type'].includes('application/json')) {
                try {
                    req.body = JSON.parse(data);
                } catch (e) {
                    console.error('Error parsing JSON body:', e.message);
                    // Keep raw body as fallback
                }
            }
        }
        next();
    });
};

// Use raw body parser instead of express.json()
app.use(rawBodyParser);

// Log middleware
app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Raw Body:', req.rawBody);
    console.log('Parsed Body:', JSON.stringify(req.body, null, 2));
    next();
});

// Handle all routes
app.all('*', async(req, res) => {
    try {
        const targetUrl = `http://3.137.223.39:3303${req.url}`;
        console.log(`Forwarding to: ${targetUrl}`);

        // Headers to forward (excluding ones that might cause issues)
        const headers = {...req.headers };
        delete headers['content-length']; // Let axios calculate this
        headers.host = '3.137.223.39:3303'; // Set correct host

        // Determine what to use as request body
        let requestBody;
        if (req.headers['content-type'] &&
            req.headers['content-type'].includes('application/json')) {
            // Use parsed JSON if available, otherwise use raw body
            requestBody = req.body || req.rawBody;
            console.log('Using JSON body:', JSON.stringify(requestBody, null, 2));
        } else {
            // Use raw body for non-JSON requests
            requestBody = req.rawBody;
            console.log('Using raw body');
        }

        // Forward the request with axios
        const response = await axios({
            method: req.method,
            url: targetUrl,
            headers: headers,
            data: requestBody,
            responseType: 'arraybuffer',
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            validateStatus: () => true, // Don't throw on non-2xx
        });

        console.log(`Response status: ${response.status}`);

        // Set response status
        res.status(response.status);

        // Set response headers
        Object.entries(response.headers).forEach(([key, value]) => {
            if (!['content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
                res.set(key, value);
            }
        });

        // Send response
        res.send(response.data);

    } catch (error) {
        console.error('Proxy error:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.status);
        }
        res.status(500).send('Proxy Error: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Fixed proxy server running on port ${PORT}`);
});