const db = require('./src/config/db');

const specializations = {
  'Hassan Ali': 'Cardiology',
  'Muhammad Bilal': 'Neurology',
  'Zain Ali': 'Orthopedics',
  'Dr. Imran Haider': 'General Medicine',
  'Dr. Naveed Iqbal': 'Pediatrics',
  'Dr. Asad Mehmood': 'Dermatology',
  'Dr. Salman Raza': 'Surgery',
  'QWER': 'Cardiology',
  'Ahmed Ali': 'General Medicine',
  'ZXCV': 'Neurology',
  'doctor1': 'Orthopedics',
  'hello': 'Pediatrics',
  'Doc Ali': 'Surgery'
};

const updateSpecializations = async () => {
  try {
    for (const [name, spec] of Object.entries(specializations)) {
      const result = await db.query(
        'UPDATE users SET specialization = $1 WHERE full_name = $2 AND role = $3',
        [spec, name, 'doctor']
      );
      console.log(`Updated ${name} to ${spec} (${result.rowCount} rows affected)`);
    }
    console.log(' All specializations updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating specializations:', error);
    process.exit(1);
  }
};

updateSpecializations();
