import { useNavigate } from 'react-router-dom';
import { cities } from '../data/cities';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="page home-page">
      <h1 className="page-title">Food Ordering</h1>
      <p className="page-subtitle">Choose your city to view the menu</p>
      <div className="city-buttons">
        {Object.values(cities).map((city) => (
          <button
            key={city.id}
            type="button"
            className="btn btn-city"
            onClick={() => navigate(`/${city.id}`)}
          >
            {city.name}
          </button>
        ))}
      </div>
    </main>
  );
}
