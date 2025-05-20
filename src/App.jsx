import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './pages/Dashboard';
import NotAuthorized from './pages/NotAuthorized';
import ParentDashboard from './pages/ParentDashboard'; // ✅ added

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/not-authorized" element={<NotAuthorized />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} /> {/* ✅ added */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
