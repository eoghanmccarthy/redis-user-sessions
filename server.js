const express = require('express');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');

const app = express();
const redis = new Redis();

app.use(express.json());

// Login: create session and mark as online
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // In real app, validate credentials here

    const sessionId = uuidv4();
    const userData = {
        username,
        loginTime: new Date().toISOString()
    };

    // Create session (1 hour expiry)
    await redis.setex(`session:${sessionId}`, 3600, JSON.stringify(userData));

    // Add to online users set
    await redis.sadd('online_users', username);

    res.json({
        sessionId,
        message: 'Logged in successfully'
    });
});

// Logout: remove session and online status
app.post('/logout', async (req, res) => {
    const sessionId = req.headers.authorization;

    // Get session data
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
        return res.status(401).json({ error: 'Invalid session' });
    }

    const { username } = JSON.parse(sessionData);

    // Remove session and online status
    await Promise.all([
        redis.del(`session:${sessionId}`),
        redis.srem('online_users', username)
    ]);

    res.json({ message: 'Logged out successfully' });
});

// Heartbeat to update online status
app.post('/heartbeat', async (req, res) => {
    const sessionId = req.headers.authorization;

    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
        return res.status(401).json({ error: 'Invalid session' });
    }

    const { username } = JSON.parse(sessionData);
    await redis.sadd('online_users', username);

    res.json({ message: 'Heartbeat received' });
});

// Get all online users
app.get('/users/online', async (req, res) => {
    const onlineUsers = await redis.smembers('online_users');
    res.json({ onlineUsers });
});

// Check specific user's online status
app.get('/users/:username/status', async (req, res) => {
    const { username } = req.params;
    const isOnline = await redis.sismember('online_users', username);
    res.json({
        username,
        online: Boolean(isOnline)
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
