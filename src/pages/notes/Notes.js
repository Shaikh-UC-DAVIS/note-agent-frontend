import React from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/dashboard-header/DashboardHeader";
import "./Notes.css";

function Notes() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader />
        <div className="dashboard-content">
          <p>This is the Notes page.</p>
        </div>
      </div>
    </div>
  );
}

export default Notes;
