import { useNavigate } from "react-router-dom";
import ResultCard from "../components/ResultCard";
import { ResultType, TriagePayload } from "../types";

function Result() {
  const navigate = useNavigate();
  const storedResultType = localStorage.getItem("hp_resultType");
  const VALID_RESULT_TYPES: ResultType[] = ["crisis", "hub", "peer", "info"];
  const resultType: ResultType = VALID_RESULT_TYPES.includes(storedResultType as ResultType)
    ? (storedResultType as ResultType)
    : "hub";
  const triage = getStoredTriage();

  function handleRestart() {
    localStorage.removeItem("hp_answers");
    localStorage.removeItem("hp_resultType");
    localStorage.removeItem("hp_triage");
    navigate("/chat");
  }

  return (
    <div className="result-page">
      {/* Header */}
      <header className="site-header">
        <a href="/" className="logo">🌿 Hope Pathways</a>
      </header>

      <TriageInsights triage={triage} />

      {/* Result content */}
      {resultType === "crisis" && <CrisisResult onRestart={handleRestart} />}
      {resultType === "hub" && <HubResult onRestart={handleRestart} />}
      {resultType === "peer" && <PeerResult onRestart={handleRestart} />}
      {resultType === "info" && <InfoResult onRestart={handleRestart} />}

      {/* Safety footer */}
      <footer className="safety-footer">
        Hope Pathways does not replace professional crisis support, emergency services, therapy, or medical care.
      </footer>
    </div>
  );
}

function TriageInsights({ triage }: { triage: TriagePayload | null }) {
  if (!triage) return null;

  return (
    <section className="result-cards" aria-label="triage-insights">
      <ResultCard
        icon="🧭"
        title="Recommended next step"
        description={triage.recommended_resource}
      />
      <ResultCard
        icon="📝"
        title="Check-in summary"
        description={triage.summary}
      />
      <ResultCard
        icon="🌐"
        title="Language detected"
        description={triage.language_detected}
      />
      {triage.flags.length > 0 && (
        <ResultCard
          icon="🏷️"
          title="Support flags"
          description={triage.flags.join(", ")}
        />
      )}
    </section>
  );
}

function CrisisResult({ onRestart }: { onRestart: () => void }) {
  return (
    <>
      <section className="result-hero">
        <div className="result-icon">🆘</div>
        <h1>Urgent support is available now.</h1>
        <p>
          If you or someone else is in immediate danger, call 000 now. You can also
          contact Lifeline or Suicide Call Back Service for immediate support.
        </p>
      </section>

      <div className="crisis-buttons">
        <a href="tel:000" className="btn btn-warm btn-block">Call 000</a>
        <a href="tel:131114" className="btn btn-warm btn-block">Lifeline 13 11 14</a>
        <a href="tel:1300659467" className="btn btn-warm btn-block">Suicide Call Back Service 1300 659 467</a>
      </div>

      <div className="result-actions">
        <button className="btn btn-secondary btn-small" onClick={onRestart}>Start again</button>
      </div>
    </>
  );
}

function HubResult({ onRestart }: { onRestart: () => void }) {
  return (
    <>
      <section className="result-hero">
        <div className="result-icon">🏥</div>
        <h1>A local support pathway may help.</h1>
        <p>
          Based on your answers, a local mental health support hub or walk-in service
          could be a helpful next step.
        </p>
      </section>

      <div className="result-cards">
        <ResultCard icon="🏠" title="Evolve Mental Health & Wellbeing Hub" description="Walk-in support and community programs" />
        <ResultCard icon="🩺" title="Local GP or community health service" description="Book an appointment for an assessment" />
        <ResultCard icon="📅" title="Follow-up check-in" description="Option for a guided follow-up in the future" />
      </div>

      <div className="result-actions">
        <button className="btn btn-primary btn-small" onClick={onRestart}>Start again</button>
      </div>
    </>
  );
}

function PeerResult({ onRestart }: { onRestart: () => void }) {
  return (
    <>
      <section className="result-hero">
        <div className="result-icon">🤝</div>
        <h1>Connection support may help.</h1>
        <p>
          Based on your answers, peer support or speaking with someone could be a
          helpful next step.
        </p>
      </section>

      <div className="result-cards">
        <ResultCard icon="👤" title="Peer support worker" description="Speak with someone who has lived experience" />
        <ResultCard icon="👥" title="Community group" description="Join a local or online peer support group" />
        <ResultCard icon="📞" title="Phone support" description="Talk to a trained volunteer or counsellor" />
      </div>

      <div className="result-actions">
        <button className="btn btn-primary btn-small" onClick={onRestart}>Start again</button>
      </div>
    </>
  );
}

function InfoResult({ onRestart }: { onRestart: () => void }) {
  return (
    <>
      <section className="result-hero">
        <div className="result-icon">📘</div>
        <h1>Information and self-guided support.</h1>
        <p>
          Based on your answers, practical information and self-guided resources may
          be a good starting point.
        </p>
      </section>

      <div className="result-cards">
        <ResultCard icon="🧘" title="Coping strategies" description="Practical techniques for managing difficult moments" />
        <ResultCard icon="📍" title="Local service information" description="Find services and support near you" />
        <ResultCard icon="💬" title="How to support someone else" description="Guidance on helping a friend or family member" />
      </div>

      <div className="result-actions">
        <button className="btn btn-primary btn-small" onClick={onRestart}>Start again</button>
      </div>
    </>
  );
}

function getStoredTriage(): TriagePayload | null {
  const raw = localStorage.getItem("hp_triage");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as TriagePayload;
    if (
      typeof parsed.classification === "string" &&
      typeof parsed.crisis === "boolean" &&
      typeof parsed.summary === "string" &&
      typeof parsed.recommended_resource === "string" &&
      typeof parsed.language_detected === "string" &&
      Array.isArray(parsed.flags)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export default Result;
