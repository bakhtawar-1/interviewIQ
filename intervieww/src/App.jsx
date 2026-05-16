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

// New Pages (Phase 4)
import CandidateProfile from './pages/CandidateProfile';
import JobListings from './pages/JobListings';
import ApplicationStatus from './pages/ApplicationStatus';
import PostJob from './pages/PostJob';
import RecruiterApplicationReview from './pages/RecruiterApplicationReview';
import RecruiterJobManagement from './pages/RecruiterJobManagement';
import RecruiterJobApplications from './pages/RecruiterJobApplications';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* Candidate Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<CandidateProfile />} />
        <Route path="/jobs" element={<JobListings />} />
        <Route path="/applications" element={<ApplicationStatus />} />
        <Route path="/interview/new" element={<NewInterview />} />
        <Route path="/interview/video" element={<VideoInterview />} />
        <Route path="/interview/:id" element={<InterviewSession />} />

        {/* Recruiter Routes */}
        <Route path="/recruiter" element={<RecruiterDashboard />} />
        <Route path="/recruiter/candidates/:candidateId" element={<RecruiterCandidateProfile />} />
        <Route path="/recruiter/post-job" element={<PostJob />} />
        <Route path="/recruiter/jobs/:jobId" element={<RecruiterJobManagement />} />
        <Route path="/recruiter/jobs/:jobId/applications" element={<RecruiterJobApplications />} />
        <Route path="/recruiter/applications/:applicationId" element={<RecruiterApplicationReview />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
