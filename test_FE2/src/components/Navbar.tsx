import { useLocation, useNavigate } from 'react-router-dom';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const handleHomeClick = () => {
    if (!isHome) {
      navigate('/');
    }
  };

  return (
    <nav className="navbar">
      <button
        type="button"
        className={`navbar-home${isHome ? ' navbar-home--active' : ''}`}
        onClick={handleHomeClick}
        aria-current={isHome ? 'page' : undefined}
      >
        Home
      </button>
    </nav>
  );
}
