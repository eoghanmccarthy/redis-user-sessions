# Redis User Sessions

What is Redis?
Redis is an in-memory store on your server for temporary data, not a permanent database.

Track user sessions and online status.

## Why separate session status from online status?

1. Checking online status through set membership (`sismember`) is faster than searching through session data
2. "Online" often means "actively using the app" while "logged in" means "has valid authentication". A user might be logged in but inactive
3. Sessions typically last hours or days, while online status should timeout after minutes of inactivity without user interaction

```bash
# In first terminal:
redis-server

# In second terminal:
bun run dev
```
## Usage

```bash
# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "test123"}'

# Check online users
curl http://localhost:3000/users/online

# Heartbeat (replace SESSION_ID)
curl -X POST http://localhost:3000/heartbeat \
  -H "Authorization: SESSION_ID"

# Logout (replace SESSION_ID)
curl -X POST http://localhost:3000/logout \
  -H "Authorization: SESSION_ID"
```


