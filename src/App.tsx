import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CreateInvoice from './pages/CreateInvoice';
import CustomerPaymentPortal from './components/invoices/CustomerPaymentPortal';
import PaymentPortal from './pages/PaymentPortal';
import PaymentSuccess from './pages/PaymentSuccess';

// Lazy load pages for better performance
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Customers = lazy(() => import('./pages/customers/Customers'));
const CustomerCreate = lazy(() => import('./pages/customers/CustomerCreate'));
const CustomerDetail = lazy(() => import('./pages/customers/CustomerDetail'));
const Quotes = lazy(() => import('./pages/quotes/Quotes'));
const QuoteCreate = lazy(() => import('./pages/quotes/QuoteCreate'));
const QuoteDetail = lazy(() => import('./pages/quotes/QuoteDetail'));
const Jobs = lazy(() => import('./pages/jobs/Jobs'));
const JobDetail = lazy(() => import('./pages/jobs/JobDetail'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const Pricing = lazy(() => import('./pages/Pricing'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pricing" element={<Pricing />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/new" element={<CustomerCreate />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/quotes" element={<Quotes />} />
              <Route path="/quotes/new" element={<QuoteCreate />} />
              <Route path="/quotes/:id" element={<QuoteDetail />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/app/invoices/create/:jobId" element={<CreateInvoice />} />
              <Route path="/pay/:invoiceId" element={<PaymentPortal />} />
              <Route path="/pay/:invoiceId/success" element={<PaymentSuccess />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        {/* Toast notifications */}
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
