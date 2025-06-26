import { Link } from 'react-router-dom';

const Navigation = () => {
    return (
        <nav className="nav-container">
            <div className="nav-item">
                <Link to="/">Visa meddelanden</Link>
            </div>
            <div className="nav-item">
                <Link to="/post">Skriv meddelande</Link>
            </div>
        </nav>
    );
};

export default Navigation;
