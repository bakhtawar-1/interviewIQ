import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import NewInterview from './pages/NewInterview';
import InterviewSession from './pages/InterviewSession';
import VideoInterview from './pages/VideoInterview';
import RecruiterDashboard from './pages/RecruiterDashboard';
import RecruiterCandidateProfile from './pages/RecruiterCandidateProfile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/recruiter/candidates/:candidateId" element={<RecruiterCandidateProfile />} />
        <Route path="/recruiter" element={<RecruiterDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/interview/new" element={<NewInterview />} />
        <Route path="/interview/video" element={<VideoInterview />} />
        <Route path="/interview/:id" element={<InterviewSession />} />
      </Routes>
    </Router>
  );
}

export default App;
