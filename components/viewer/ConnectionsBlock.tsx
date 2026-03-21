import ReactMarkdown from "react-markdown";
import { remarkPlugins, rehypePlugins } from "@/lib/markdown";

interface ConnectionsBlockProps {
  connections: string;
}

export function ConnectionsBlock({ connections }: ConnectionsBlockProps) {
  if (!connections) return null;

  return (
    <div className="mt-8 p-5 bg-accent-light/40 rounded-xl border border-accent/10">
      <h4 className="font-sans text-xs font-medium text-accent uppercase tracking-widest mb-3">Connections</h4>
      <div className="font-body text-sm text-text-secondary leading-reading prose prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>{connections}</ReactMarkdown>
      </div>
    </div>
  );
}
