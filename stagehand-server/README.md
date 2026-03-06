# BunnyWorks Stagehand Server

Automation server for OnlyFans earnings scraping using Stagehand + Browserbase.

## Setup on Oracle Cloud

1. **SSH into your server:**
   ```bash
   ssh ubuntu@92.4.80.196
   ```

2. **Install Node.js** (if not already):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Upload this folder** to your server (e.g. via scp or git):
   ```bash
   scp -r stagehand-server/ ubuntu@92.4.80.196:~/stagehand-server/
   ```

4. **Install dependencies:**
   ```bash
   cd ~/stagehand-server
   npm install
   ```

5. **Create your .env file:**
   ```bash
   cp .env.example .env
   nano .env
   ```
   Fill in your Browserbase API key and project ID.

6. **Open port 3000** in Oracle Cloud:
   - Go to Oracle Cloud Console → Networking → Virtual Cloud Networks
   - Click your VCN → Security Lists → Default Security List
   - Add Ingress Rule: Source `0.0.0.0/0`, Port `3000`, Protocol TCP
   - Also run: `sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT`

7. **Start the server:**
   ```bash
   npm start
   ```

8. **Keep it running with PM2:**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name stagehand
   pm2 save
   pm2 startup
   ```

## API Endpoints

All `/api/*` routes require `x-api-key` header.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (no auth) |
| POST | `/api/scrape-earnings` | Scrape OF earnings page |
| POST | `/api/check-login` | Verify OF session is active |

### POST /api/scrape-earnings
```json
{
  "contextId": "browserbase-context-id",
  "creatorId": "creator-uuid"
}
```

### POST /api/check-login
```json
{
  "contextId": "browserbase-context-id",
  "creatorId": "creator-uuid"
}
```
