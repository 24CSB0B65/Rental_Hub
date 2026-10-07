import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Browse from './pages/Browse';
import PropertyDetails from './pages/PropertyDetails';
import OwnerProperties from './pages/OwnerProperties';
import PropertyForm from './pages/PropertyForm';
import MyApplications from './pages/MyApplications';
import OwnerApplications from './pages/OwnerApplications';
import Leases from './pages/Leases';
import MyMaintenance from './pages/MyMaintenance';
import OwnerMaintenance from './pages/OwnerMaintenance';
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/properties/:id" element={<PropertyDetails />} />

          <Route path="/applications" element={<PrivateRoute role="renter"><MyApplications /></PrivateRoute>} />
          <Route path="/maintenance" element={<PrivateRoute role="renter"><MyMaintenance /></PrivateRoute>} />

          <Route path="/owner/properties" element={<PrivateRoute role="owner"><OwnerProperties /></PrivateRoute>} />
          <Route path="/owner/properties/new" element={<PrivateRoute role="owner"><PropertyForm /></PrivateRoute>} />
          <Route path="/owner/properties/:id/edit" element={<PrivateRoute role="owner"><PropertyForm /></PrivateRoute>} />
          <Route path="/owner/applications" element={<PrivateRoute role="owner"><OwnerApplications /></PrivateRoute>} />
          <Route path="/owner/maintenance" element={<PrivateRoute role="owner"><OwnerMaintenance /></PrivateRoute>} />

          <Route path="/leases" element={<PrivateRoute><Leases /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />

          <Route path="*" element={<Home />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
