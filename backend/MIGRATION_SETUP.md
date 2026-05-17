# Database Migrations

## Running Migrations

To set up the new features, you need to run the SQL migration files on your PostgreSQL database.

### For Doctor Availability Feature

Run this SQL in your database:

```sql
-- Create doctor_availability table to track available appointment slots
CREATE TABLE IF NOT EXISTS doctor_availability (
    availability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_user_id UUID NOT NULL,
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(doctor_user_id, day_of_week, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON doctor_availability(doctor_user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_day ON doctor_availability(day_of_week);
```

### Option 1: Using psql Command Line

```bash
psql -U your_db_user -d your_db_name -f backend/migrations/002_add_doctor_availability.sql
```

### Option 2: Using pgAdmin

1. Open pgAdmin
2. Connect to your database
3. Open Query Tool
4. Copy and paste the SQL from `backend/migrations/002_add_doctor_availability.sql`
5. Execute the query

### Option 3: Using Node.js Script (Recommended)

Create a file `backend/runMigration.js`:

```javascript
const pg = require('pg');
const fs = require('fs');
require('dotenv').config();

const client = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function runMigration() {
  try {
    await client.connect();
    const sql = fs.readFileSync('migrations/002_add_doctor_availability.sql', 'utf8');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
```

Then run: `node runMigration.js`

## Verify Migration

After running the migration, verify the table was created:

```sql
\d doctor_availability
```

You should see the table with all columns and indexes.

## Features Unlocked

After running this migration:

1. **Doctor Availability Management**: Doctors can set their available time slots
2. **Smart Appointment Booking**: Patients can only book appointments during doctor availability
3. **Bookmark Articles**: Both patients and doctors can bookmark blog articles and view them in a dedicated section
