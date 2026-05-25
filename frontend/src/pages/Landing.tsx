import { Link } from "react-router-dom";
import Header from "../components/Header";
import UrgentSupport from "../components/UrgentSupport";

function Landing() {
  return (
    <>
      <Header />
      <main className="container">
        {/* Hero */}
        <section className="hero">
          <h1>You are not alone.</h1>
          <p className="subtitle">
            A calm place to take the next step, find support, or talk anonymously.
          </p>
          <div className="btn-group">
            <Link to="/chat" className="btn btn-primary">Start guided check-in</Link>
            <a href="#urgent" className="btn btn-secondary">Get urgent help</a>
          </div>
        </section>

        {/* Explanation */}
        <div className="explanation">
          <p>Hope Pathways helps you answer a few simple questions and find a safe next step.</p>
        </div>

        {/* Feature cards */}
        <div className="card-grid cols-3">
          <div className="card">
            <div className="card-icon">🔒</div>
            <h3>Anonymous first</h3>
            <p>No login or name required to start.</p>
          </div>
          <div className="card">
            <div className="card-icon">⏱️</div>
            <h3>3-minute check-in</h3>
            <p>Simple, plain-language questions.</p>
          </div>
          <div className="card">
            <div className="card-icon">🧭</div>
            <h3>Clear next step</h3>
            <p>Find support, local services, or urgent help.</p>
          </div>
        </div>

        {/* Urgent support */}
        <UrgentSupport />
      </main>

      <footer className="site-footer">
        Hope Pathways does not replace professional crisis support, emergency services, therapy, or medical care.
      </footer>
    </>
  );
}

export default Landing;
