import React from 'react';
import Sidebar from '../../components/sidebar/Sidebar';
import DashboardHeader from '../../components/dashboard-header/DashboardHeader';
import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader />
        <div className="dashboard-content">
          {/* Weekly Summary Section */}
          <section className="content-section">
            <h2 className="section-title">Weekly Summary</h2>
            {/* Box will appear here when there's content */}
            <p className="empty-state">No Summary this week</p>
          </section>

          {/* Task Review Section */}
          <section className="content-section">
            <h2 className="section-title">Task Review</h2>
            {/* Box will appear here when there's content */}
            <p className="empty-state">No Tasks this week</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
