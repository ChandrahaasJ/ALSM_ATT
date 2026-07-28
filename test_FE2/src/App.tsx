import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { PaymentPage } from './pages/PaymentPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:cityId" element={<MenuPage />} />
          <Route path="/:cityId/payment" element={<PaymentPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
