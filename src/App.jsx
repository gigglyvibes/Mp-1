import React from "react";
import { Routes, Route } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

import HomePage from "./pages/HomePage";
import AllJobsPage from "./pages/AllJobsPage";
import NearbyJobsPage from "./pages/NearbyJobsPage";
import JobDetailsPage from "./pages/JobDetailsPage";
import CategoriesPage from "./pages/CategoriesPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import AboutPage from "./pages/AboutPage";
import FaqPage from "./pages/FaqPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import LoginPage from "./pages/LoginPage";
import RegisterChoicePage from "./pages/RegisterChoicePage";
import RegisterStudentPage from "./pages/RegisterStudentPage";
import RegisterBusinessPage from "./pages/RegisterBusinessPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";

import StudentDashboardPage from "./pages/student/StudentDashboardPage";
import BusinessDashboardPage from "./pages/business/BusinessDashboardPage";
import CreateJobPage from "./pages/business/CreateJobPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AgreementPage from "./pages/AgreementPage";
import ActiveJobPage from "./pages/ActiveJobPage";

const App = () => (
  <SocketProvider>
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs" element={<AllJobsPage />} />
        <Route path="/all-jobs" element={<AllJobsPage />} />
        <Route path="/nearby" element={<NearbyJobsPage />} />
        <Route path="/nearby-jobs" element={<NearbyJobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailsPage />} />
        <Route path="/agreements/application/:applicationId" element={<AgreementPage />} />
        <Route path="/job-types" element={<CategoriesPage />} />
        <Route path="/job-categories" element={<CategoriesPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterChoicePage />} />
        <Route path="/register/student" element={<RegisterStudentPage />} />
        <Route path="/register/business" element={<RegisterBusinessPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Active jobs */}
        <Route element={<ProtectedRoute />}>
          <Route path="/active-jobs/:jobId" element={<ActiveJobPage />} />
        </Route>

        {/* Student */}
        <Route element={<ProtectedRoute role="student" />}>
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        </Route>

        {/* Business */}
        <Route element={<ProtectedRoute role="business" />}>
          <Route path="/business/dashboard" element={<BusinessDashboardPage />} />
          <Route path="/business/jobs/create" element={<CreateJobPage />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </SocketProvider>
);

export default App;
