interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="progress-bar">
      <div className="progress-dots">
        {Array.from({ length: totalSteps }, (_, i) => {
          let className = "dot";
          if (i < currentStep) className += " done";
          else if (i === currentStep) className += " active";
          return <span key={i} className={className} />;
        })}
      </div>
      <span className="step-text">Step {currentStep + 1} of {totalSteps}</span>
    </div>
  );
}

export default ProgressBar;
