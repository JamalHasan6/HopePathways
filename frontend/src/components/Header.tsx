import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="site-header">
      <Link to="/" className="logo">🌿 Hope Pathways</Link>
      <br />
      <span className="badge">Suicide Prevention Network Hackathon</span>
    </header>
  );
}

export default Header;
