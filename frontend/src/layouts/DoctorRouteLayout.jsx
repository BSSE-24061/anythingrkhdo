import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import DoctorSidebar from "../components/DoctorSidebar";
import "../styles/styles.css";

const DoctorRouteLayout = () => {
  return (
    <div className="app-root doctor-root">
      <Navbar />
      <div className="app-body">
        <DoctorSidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoctorRouteLayout;
