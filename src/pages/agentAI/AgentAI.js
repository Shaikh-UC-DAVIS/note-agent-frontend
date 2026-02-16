import React from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/dashboard-header/DashboardHeader";
import "./AgentAI.css";

function AgentAI() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader />
        <div className="dashboard-content">
          <p>This is the Agent AI page.</p>
        </div>
      </div>
    </div>
  );
}

export default AgentAI;
