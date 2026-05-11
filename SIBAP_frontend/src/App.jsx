import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import DashboardHome from './pages/dashboard/DashboardHome';
import NewBankPage from './pages/dashboard/newBank';
import MyBanksPage from './pages/dashboard/MyBanksPage';
import MyProfile from './pages/dashboard/MyProfile';
import ValidateQuestionsPage from './pages/dashboard/ValidateQuestionsPage';
import DocumentProcessorPage from './pages/documents/DocumentProcessorPage';
import DocumentViewerPage from './pages/documents/DocumentViewerPage';
import SupportPage from './pages/dashboard/SupportPage';
import ManualPage from './pages/ManualPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/manual-de-usuario" element={<ManualPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="new-bank" element={<NewBankPage />} />
              <Route path="banks" element={<MyBanksPage />} />
              <Route path="profile" element={<MyProfile />} />
              <Route path="validate" element={<ValidateQuestionsPage />} />
              <Route path="documents" element={<DocumentProcessorPage />} />
              <Route path="documents/:id" element={<DocumentViewerPage />} />
              <Route path="support" element={<SupportPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
