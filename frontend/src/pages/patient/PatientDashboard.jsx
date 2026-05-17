import { Routes, Route, Link } from 'react-router-dom';

import Overview from './Overview';
import BookAppointment from './BookAppointment';
import Specializations from './Specializations';
import MedicalHistory from './MedicalHistory';
import Vitals from './Vitals';
import MedicationLogs from './MedicationLogs';
import Blogs from './Blogs';
import Forum from './Forum';
import Chat from './Chat';
import Consultant from './Consultant';

const PatientDashboard = () => {

  const user = JSON.parse(localStorage.getItem('user'));

  const menu = [
    ['Overview', ''],
    ['Appointments', 'appointments'],
    ['Specializations', 'specializations'],
    ['Medical History', 'history'],
    ['Vitals', 'vitals'],
    ['Medication Logs', 'medications'],
    ['Blogs', 'blogs'],
    ['Forum', 'forum'],
    ['Chat', 'chat'],
    ['Consultant Chat', 'consultant'],
  ];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#000814',
      }}
    >

      {/* Sidebar */}

      <div
        style={{
          width: '280px',
          background: '#001d3d',
          padding: '25px',
          color: 'white',
        }}
      >

        <h2 style={{ color: '#ffd60a' }}>
          HMS Portal
        </h2>

        <h3>
          {user.name}
        </h3>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            marginTop: '40px',
          }}
        >

          {menu.map(([label, path]) => (
            <Link
              key={path}
              to={path}
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: '#003566',
                color: 'white',
                textDecoration: 'none',
                transition: '0.3s',
              }}
            >
              {label}
            </Link>
          ))}

        </div>

      </div>

      {/* Main */}

      <div
        style={{
          flex: 1,
          padding: '35px',
          color: 'white',
        }}
      >

        <Routes>

          <Route index element={<Overview />} />

          <Route path="appointments" element={<BookAppointment />} />

          <Route path="specializations" element={<Specializations />} />

          <Route path="history" element={<MedicalHistory />} />

          <Route path="vitals" element={<Vitals />} />

          <Route path="medications" element={<MedicationLogs />} />

          <Route path="blogs" element={<Blogs />} />

          <Route path="forum" element={<Forum />} />

          <Route path="chat" element={<Chat />} />

          <Route path="consultant" element={<Consultant />} />

        </Routes>

      </div>

    </div>
  );
};

export default PatientDashboard;
