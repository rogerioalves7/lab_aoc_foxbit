import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { MarketProvider } from './contexts/MarketContext';

import MarketOverview from './pages/MarketOverview';
import Opportunities from './pages/Opportunities';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';

export default function App() {
  return (
    // 1º: O Router agora é o elemento mais externo
    <Router>
      
      // 2º: O MarketProvider fica dentro do Router (agora ele tem acesso ao useNavigate!)
      <MarketProvider>
        
        <div className="background-blur"></div>
        <div className="page-container">
          {/* 3º: As rotas normais continuam aqui dentro */}
          <Routes>
            <Route path="/" element={<MarketOverview />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </div>

        <ToastContainer 
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        
      </MarketProvider>
    </Router>
  );
}