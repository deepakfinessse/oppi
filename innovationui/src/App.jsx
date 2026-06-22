// App.jsx
import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Auth from './pages/Auth/Auth';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import ApplicationForm from './pages/ApplicationForm/ApplicationForm';
import AdminDashboard from './pages/Dashboards/AdminDashboard';
import ValidatorDashboard from './pages/Dashboards/ValidatorDashboard';
import JuryDashboard from './pages/Dashboards/JuryDashboard';
import ViewApplication from './pages/Dashboards/ViewApplication';
import ApplicantDashboard from './pages/Dashboards/ApplicantDashboard';
import ThankYou from './pages/ThankYou/ThankYou';
import ChangePassword from './pages/ChangePassword/ChangePassword';
import { getSession } from './services/api';
import './App.css';

function ProtectedRoute({ children, role }) {
  const session = getSession();
  if (!session?.token) return <Navigate to="/auth" replace />;
  if (role && session.role !== role && session.role !== 'ADMIN') return <Navigate to="/auth" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/change-password" element={
        <ProtectedRoute>
          <ChangePassword />
        </ProtectedRoute>
      } />
      <Route path="/application" element={
        <ProtectedRoute>
          <ApplicationForm />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute role="ADMIN">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/validator" element={
        <ProtectedRoute role="VALIDATOR">
          <ValidatorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/jury" element={
        <ProtectedRoute role="JURY">
          <JuryDashboard />
        </ProtectedRoute>
      } />
      <Route path="/review/:id" element={
        <ProtectedRoute>
          <ViewApplication />
        </ProtectedRoute>
      } />
      <Route path="/admin/edit-application/:id" element={
        <ProtectedRoute role="ADMIN">
          <ApplicationForm />
        </ProtectedRoute>
      } />
      {/* <Route path="/my-application" element={
        <ProtectedRoute>
          <ViewApplication isMine={true} />
        </ProtectedRoute>
      } /> */}
      <Route path="/thank-you" element={
        <ProtectedRoute>
          <ThankYou isMine={true}/>
        </ProtectedRoute>
      } />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}

export default App;