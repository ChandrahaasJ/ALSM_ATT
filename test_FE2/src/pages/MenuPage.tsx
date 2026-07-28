import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { cities, isCityId } from '../data/cities';

export function MenuPage() {
  const { cityId } = useParams();
  const navigate = useNavigate();

  if (!cityId || !isCityId(cityId)) {
    return <Navigate to="/" replace />;
  }

  const city = cities[cityId];

  return (
    <main className="page menu-page">
      <h1 className="page-title">{city.name} Menu</h1>
      <ul className="food-list">
        {city.items.map((item) => (
          <li key={item} className="food-item">
            {item}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => navigate(`/${city.id}/payment`)}
      >
        Checkout
      </button>
    </main>
  );
}
