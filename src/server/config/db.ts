import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

console.log(process.env.DB_NAME);

const pool = new Pool({
  port: parseInt(process.env.DB_PORT || '5432', 10),
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

console.log('Connecting to DB:', process.env.DB_NAME);


pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch((err) => console.error('❌ Connection error', err));

export default pool
