import React from "react";
import { NavLink } from "react-router-dom";

const DoctorSidebar = () => {
  return (
    <aside className="sidebar doctor-sidebar">
      <nav>
        <ul>
          <li>
            <NavLink to="/doctor/dashboard">Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/doctor/appointments">Appointments</NavLink>
          </li>
          <li>
            <NavLink to="/doctor/vitals">Vitals</NavLink>
          </li>
          <li>
            <NavLink to="/doctor/patients">Patients</NavLink>
          </li>
          <li>
            <NavLink to="/doctor/prescriptions">Prescriptions</NavLink>
          </li>
          <li>
            <NavLink to="/doctor/medication-logs">Medication Logs</NavLink>
          </li>
          <li>
            <NavLink to="/doctor/history">Medical History</NavLink>
          </li>
          <li>
            <NavLink to="/doctor/availability">Availability</NavLink>
          </li>
          <li>
            <NavLink to="/doctor/chat">Chat</NavLink>
          </li>
          <li>
            <NavLink to="/doctor/blogs">Blogs</NavLink>
          </li>
          <li>
            <NavLink to="/doctor/forum">Forum</NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default DoctorSidebar;
