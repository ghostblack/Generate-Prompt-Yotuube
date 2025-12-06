import React from 'react';
import { Copy, Check } from 'lucide-react';

interface ResultCardProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  onCopy: (text: string) => void;
  colorClass: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ title, content, icon, onCopy, colorClass }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    onCopy(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!content) return null;

  return (
    <div className="bg-white rounded-xl shadow-md border border-orange-100 overflow-hidden transition-all hover:shadow-lg">
      <div className={`px-4 py-3 ${colorClass} flex items-center gap-2`}>
        <div className="text-white">{icon}</div>
        <h3 className="font-semibold text-white text-sm uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-4 relative group">
        <p className="text-gray-700 text-sm leading-relaxed pr-8 min-h-[60px]">{content}</p>
        <button
          onClick={handleCopy}
          className="absolute top-4 right-4 text-gray-400 hover:text-orange-500 transition-colors p-1 bg-white bg-opacity-80 rounded-full"
          title="Copy to clipboard"
        >
          {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
        </button>
      </div>
    </div>
  );
};