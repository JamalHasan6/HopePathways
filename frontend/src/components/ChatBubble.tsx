interface ChatBubbleProps {
  text: string;
  role: "assistant" | "user";
}

function ChatBubble({ text, role }: ChatBubbleProps) {
  // Render line breaks and bold text (**text**) for assistant messages
  if (role === "assistant") {
    const parts = text.split("\n").map((line, i) => {
      // Convert **bold** to <strong>
      const segments = line.split(/(\*\*[^*]+\*\*)/g).map((seg, j) => {
        if (seg.startsWith("**") && seg.endsWith("**")) {
          return <strong key={j}>{seg.slice(2, -2)}</strong>;
        }
        return <span key={j}>{seg}</span>;
      });
      return (
        <span key={i}>
          {i > 0 && <br />}
          {segments}
        </span>
      );
    });
    return <div className={`bubble ${role}`}>{parts}</div>;
  }

  return <div className={`bubble ${role}`}>{text}</div>;
}

export default ChatBubble;
