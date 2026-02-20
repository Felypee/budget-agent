# 🚀 Deployment Guide - Monedita MVP

## Production Deployment Options

### Option 1: Heroku (Recommended for MVP)

#### Prerequisites
- Heroku account
- Heroku CLI installed
- Git repository

#### Steps

1. **Install Heroku CLI**
```bash
# macOS
brew install heroku/brew/heroku

# Windows
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

2. **Login to Heroku**
```bash
heroku login
```

3. **Create Heroku App**
```bash
cd financeflow-mvp
heroku create financeflow-production
```

4. **Add PostgreSQL Database**
```bash
heroku addons:create heroku-postgresql:mini
```

5. **Set Environment Variables**
```bash
heroku config:set WHATSAPP_TOKEN=your_token
heroku config:set WHATSAPP_VERIFY_TOKEN=your_verify_token
heroku config:set WHATSAPP_PHONE_NUMBER_ID=your_phone_id
heroku config:set ANTHROPIC_API_KEY=your_anthropic_key
heroku config:set NODE_ENV=production
```

6. **Create Procfile**
```bash
echo "web: node src/server.js" > Procfile
```

7. **Deploy**
```bash
git add .
git commit -m "Initial production deployment"
git push heroku main
```

8. **Configure WhatsApp Webhook**
- URL: `https://budget-agent-production.up.railway.app/webhook`
- Update in Meta Developer Console

9. **Scale Dynos**
```bash
heroku ps:scale web=1
```

10. **Monitor Logs**
```bash
heroku logs --tail
```

---

### Option 2: AWS (EC2 + RDS)

#### Architecture
```
┌─────────────────┐
│   Route 53      │ (DNS)
└────────┬────────┘
         │
┌────────▼────────┐
│  Application    │ (Load Balancer)
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ EC2  │  │ EC2  │ (Auto Scaling Group)
│ Node │  │ Node │
└───┬──┘  └──┬───┘
    │         │
    └────┬────┘
         │
┌────────▼────────┐
│   RDS           │ (PostgreSQL)
│   Database      │
└─────────────────┘
```

#### Steps

1. **Launch EC2 Instance**
```bash
# Choose Amazon Linux 2 AMI
# Instance type: t3.small (minimum)
# Configure security groups:
#   - Allow HTTP (80)
#   - Allow HTTPS (443)
#   - Allow SSH (22) from your IP
```

2. **Install Node.js**
```bash
ssh ec2-user@your-instance-ip
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

3. **Install Dependencies**
```bash
sudo yum update -y
sudo yum install git -y
```

4. **Clone Repository**
```bash
git clone https://github.com/yourrepo/financeflow-mvp.git
cd financeflow-mvp
npm install --production
```

5. **Set Up RDS PostgreSQL**
```bash
# Create RDS instance in AWS Console
# Note connection details
```

6. **Configure Environment**
```bash
nano .env
# Add all production credentials
```

7. **Set Up PM2 Process Manager**
```bash
npm install -g pm2
pm2 start src/server.js --name financeflow
pm2 startup
pm2 save
```

8. **Configure Nginx Reverse Proxy**
```bash
sudo yum install nginx -y
sudo nano /etc/nginx/nginx.conf
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

9. **Start Nginx**
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

10. **Set Up SSL with Let's Encrypt**
```bash
sudo yum install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

### Option 3: Digital Ocean App Platform

#### Steps

1. **Connect GitHub Repository**
- Go to Digital Ocean App Platform
- Click "Create App"
- Connect your GitHub repo

2. **Configure Build Settings**
```yaml
name: financeflow
region: nyc
services:
- name: web
  github:
    repo: yourrepo/financeflow-mvp
    branch: main
  build_command: npm install
  run_command: npm start
  environment_slug: node-js
  http_port: 3000
  instance_count: 1
  instance_size_slug: basic-xxs
  
databases:
- name: financeflow-db
  engine: PG
  version: "14"
```

3. **Set Environment Variables**
- In App Platform dashboard
- Add all required env vars

4. **Deploy**
- Click "Deploy"
- App Platform handles everything

---

## Database Migration (In-Memory → PostgreSQL)

### Step 1: Install PostgreSQL Driver

```bash
npm install pg
```

### Step 2: Create Database Schema

```sql
-- users table
CREATE TABLE users (
  phone VARCHAR(20) PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  preferences JSONB DEFAULT '{}'
);

-- expenses table
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) REFERENCES users(phone),
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- budgets table
CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) REFERENCES users(phone),
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  period VARCHAR(20) DEFAULT 'monthly',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(phone, category)
);

-- indexes for performance
CREATE INDEX idx_expenses_phone ON expenses(phone);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_budgets_phone ON budgets(phone);
```

### Step 3: Create PostgreSQL Database Module

```javascript
// src/database/postgresDB.js
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const UserDB = {
  async create(phone, data = {}) {
    const result = await pool.query(
      'INSERT INTO users (phone, preferences) VALUES ($1, $2) RETURNING *',
      [phone, JSON.stringify(data.preferences || {})]
    );
    return result.rows[0];
  },

  async get(phone) {
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    return result.rows[0];
  },

  async getOrCreate(phone) {
    let user = await this.get(phone);
    if (!user) {
      user = await this.create(phone);
    }
    return user;
  }
};

export const ExpenseDB = {
  async create(phone, expenseData) {
    const result = await pool.query(
      `INSERT INTO expenses (phone, amount, category, description, date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [phone, expenseData.amount, expenseData.category, 
       expenseData.description, expenseData.date || new Date()]
    );
    return result.rows[0];
  },

  async getByUser(phone) {
    const result = await pool.query(
      'SELECT * FROM expenses WHERE phone = $1 ORDER BY date DESC',
      [phone]
    );
    return result.rows;
  },

  async getByDateRange(phone, startDate, endDate) {
    const result = await pool.query(
      `SELECT * FROM expenses 
       WHERE phone = $1 AND date >= $2 AND date <= $3
       ORDER BY date DESC`,
      [phone, startDate, endDate]
    );
    return result.rows;
  },

  async getTotalByCategory(phone, category, startDate, endDate) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE phone = $1 AND category = $2 AND date >= $3 AND date <= $4`,
      [phone, category, startDate, endDate]
    );
    return parseFloat(result.rows[0].total);
  }
};

export const BudgetDB = {
  async create(phone, budgetData) {
    const result = await pool.query(
      `INSERT INTO budgets (phone, category, amount, period)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (phone, category) 
       DO UPDATE SET amount = $3, period = $4
       RETURNING *`,
      [phone, budgetData.category, budgetData.amount, budgetData.period || 'monthly']
    );
    return result.rows[0];
  },

  async getByUser(phone) {
    const result = await pool.query(
      'SELECT * FROM budgets WHERE phone = $1',
      [phone]
    );
    return result.rows;
  }
};
```

### Step 4: Update Imports

Replace in all files:
```javascript
// Old
import { UserDB, ExpenseDB, BudgetDB } from './database/inMemoryDB.js';

// New
import { UserDB, ExpenseDB, BudgetDB } from './database/postgresDB.js';
```

---

## Monitoring & Logging

### Set Up Logging

```bash
npm install winston
```

```javascript
// src/utils/logger.js
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### Set Up Error Tracking (Sentry)

```bash
npm install @sentry/node
```

```javascript
// src/server.js
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// Add before your routes
app.use(Sentry.Handlers.requestHandler());

// Add before error handlers
app.use(Sentry.Handlers.errorHandler());
```

---

## Security Checklist

- [ ] Use HTTPS only
- [ ] Validate all user inputs
- [ ] Rate limit API endpoints
- [ ] Encrypt sensitive data at rest
- [ ] Use environment variables for secrets
- [ ] Implement request signing for webhooks
- [ ] Set up CORS properly
- [ ] Keep dependencies updated
- [ ] Use security headers (helmet.js)
- [ ] Implement authentication for admin endpoints
- [ ] Regular security audits
- [ ] Backup database regularly

---

## Performance Optimization

### Caching
```bash
npm install redis
```

```javascript
import redis from 'redis';
const client = redis.createClient(process.env.REDIS_URL);

// Cache user data
async function getUserCached(phone) {
  const cached = await client.get(`user:${phone}`);
  if (cached) return JSON.parse(cached);
  
  const user = await UserDB.get(phone);
  await client.setex(`user:${phone}`, 3600, JSON.stringify(user));
  return user;
}
```

### Database Indexing
```sql
CREATE INDEX idx_expenses_phone_date ON expenses(phone, date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);
```

### Query Optimization
- Use prepared statements
- Batch inserts when possible
- Limit result sets
- Use pagination for large datasets

---

## Backup Strategy

### Automated Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump $DATABASE_URL > backups/backup_$DATE.sql
aws s3 cp backups/backup_$DATE.sql s3://your-bucket/backups/

# Keep only last 30 days
find backups/ -name "*.sql" -mtime +30 -delete
```

### Schedule with Cron
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

---

## Cost Estimation

### Heroku
- **Hobby Plan**: $7/month (dyno)
- **PostgreSQL Mini**: $5/month
- **Total**: ~$12/month + API costs

### AWS
- **EC2 t3.small**: ~$15/month
- **RDS db.t3.micro**: ~$15/month
- **Load Balancer**: ~$16/month
- **Total**: ~$46/month + API costs

### Digital Ocean
- **App Platform Basic**: $5/month
- **Database**: $15/month
- **Total**: ~$20/month + API costs

### API Costs
- **Anthropic**: Pay per token
- **WhatsApp**: Free tier available
- **Estimate**: $10-50/month depending on usage

---

## Production Checklist

- [ ] Database migrated to PostgreSQL
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Monitoring set up (Sentry, logs)
- [ ] Backup system configured
- [ ] Rate limiting implemented
- [ ] Error handling improved
- [ ] Documentation updated
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] Staging environment tested
- [ ] Rollback plan documented
- [ ] On-call rotation established

---

Ready to deploy! 🚀
