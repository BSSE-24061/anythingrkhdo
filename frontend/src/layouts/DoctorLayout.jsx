import React from "react";
import Navbar from "../components/Navbar";
import DoctorSidebar from "../components/DoctorSidebar";
import "../styles/styles.css";

const DoctorLayout = ({ children }) => {
  return (
    <div className="app-root doctor-root">
      <Navbar />
      <div className="app-body">
        <DoctorSidebar />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

export default DoctorLayout;
