const pg = require('pg');
require('dotenv').config();

const client = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function test() {
  try {
    await client.connect();
    console.log(' Connected to database');

    // Check if table exists
    const tableCheck = await client.query(
      "SELECT * FROM information_schema.tables WHERE table_name='doctor_availability'"
    );
    console.log(' Table doctor_availability exists:', tableCheck.rows.length > 0);

    // Get table structure
    const structure = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='doctor_availability' ORDER BY ordinal_position"
    );
    console.log('\n Table columns:');
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Try a test insert
    const testId = 'test-doctor-id-12345678901234567890';
    console.log('\n Testing insert with time format...');
    try {
      const result = await client.query(
        `INSERT INTO doctor_availability (doctor_user_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [testId, 'Monday', '09:00', '11:00']
      );
      console.log(' Insert successful:', result.rows[0]);

      // Clean up test data
      await client.query(
        'DELETE FROM doctor_availability WHERE availability_id = $1',
        [result.rows[0].availability_id]
      );
      console.log(' Test data cleaned up');
    } catch (insertErr) {
      console.error(' Insert failed:', insertErr.message);
    }

  } catch (error) {
    console.error(' Error:', error.message);
  } finally {
    await client.end();
  }
}

test();
