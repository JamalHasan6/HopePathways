interface ResultCardProps {
  icon: string;
  title: string;
  description: string;
}

function ResultCard({ icon, title, description }: ResultCardProps) {
  return (
    <div className="result-card">
      <div className="rc-icon">{icon}</div>
      <div>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default ResultCard;
