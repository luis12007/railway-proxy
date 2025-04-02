const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();
const TARGET_URL = "http://3.137.223.39:3303";

app.use(express.json()); // Parse JSON body
app.use(cors()); // Enable CORS

// Proxy all requests to the target server
app.use(
    "/",
    createProxyMiddleware({
        target: TARGET_URL,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader("Content-Type", "application/json");
                proxyReq.write(bodyData);
                proxyReq.end();
            }
        },
    })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));