import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import './Admin.css'; // Ek CSS dosyası

const Admin = () => {
  return (
    <div className="container mt-5">
      <div className="card shadow-sm mt-5">
        <div className="card-body">
          <h1 className="card-title text-center mb-4">Admin Dashboard</h1>
          <p className="card-text text-center">Welcome to the admin page. Here you can manage the application settings and user data.</p>
          <div className="row mt-5">
            <div className="col-md-4">
              <div className="card mb-4 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">User Management</h5>
                  <p className="card-text">Manage user accounts, roles, and permissions.</p>
                  <Link to="/admin/users" className="btn btn-primary">Go to User Management</Link>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card mb-4 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Settings</h5>
                  <p className="card-text">Configure application settings and preferences.</p>
                  <Link to="/admin/settings" className="btn btn-primary">Go to Settings</Link>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card mb-4 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Reports</h5>
                  <p className="card-text">View and generate reports on application usage and performance.</p>
                  <Link to="/admin/reports" className="btn btn-primary">Go to Reports</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;