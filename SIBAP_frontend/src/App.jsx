import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import DashboardHome from './pages/dashboard/DashboardHome';
import NewBankPage from './pages/dashboard/newBank';
import MyBanksPage from './pages/dashboard/MyBanksPage';
import MyProfile from './pages/dashboard/MyProfile';
import ValidateQuestionsPage from './pages/dashboard/ValidateQuestionsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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
              <Route path="documents" element={<div className="p-8">Sección en construcción</div>} />
              <Route path="settings" element={<div className="p-8">Sección en construcción</div>} />
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
