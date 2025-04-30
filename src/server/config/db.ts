import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: 'uno_reverse', 
  password: 'R8t!mV@2eL#pWz7qKx$3',
})

export default pool
