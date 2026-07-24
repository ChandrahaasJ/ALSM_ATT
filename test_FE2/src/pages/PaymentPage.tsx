import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { cities, formatPrice, isCityId } from '../data/cities';

export function PaymentPage() {
  const { cityId } = useParams();
  const navigate = useNavigate();
  const [paymentComplete, setPaymentComplete] = useState(false);

  if (!cityId || !isCityId(cityId)) {
    return <Navigate to="/" replace />;
  }

  const city = cities[cityId];

  if (paymentComplete) {
    return (
      <main className="page payment-page">
        <p className="payment-success">Payment completed. Return to home page.</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/')}
        >
          Return to home page
        </button>
      </main>
    );
  }

  return (
    <main className="page payment-page">
      <h1 className="page-title">Payment</h1>
      <p className="payment-city">{city.name} order</p>
      <p className="payment-price">
        Total: <span>₹{formatPrice(city.price)}</span>
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setPaymentComplete(true)}
      >
        Make Payment
      </button>
    </main>
  );
}
