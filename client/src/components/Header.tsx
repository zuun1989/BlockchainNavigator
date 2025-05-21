import { CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isChainValid: boolean;
  onValidateChain: () => void;
}

export default function Header({ isChainValid, onValidateChain }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <svg 
            className="text-primary mr-2 h-6 w-6" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          Bidirectional Blockchain
        </h1>
        <div className="flex items-center gap-4">
          <div className={`flex items-center px-3 py-1 rounded-full ${
            isChainValid 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            {isChainValid ? (
              <CheckCircle className="mr-2 h-4 w-4" />
            ) : (
              <AlertCircle className="mr-2 h-4 w-4" />
            )}
            <span>{isChainValid ? "Chain Intact" : "Chain Broken"}</span>
          </div>
          <Button 
            variant="default" 
            className="bg-gray-800 hover:bg-gray-700 text-white"
            onClick={onValidateChain}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Validate Chain
          </Button>
        </div>
      </div>
    </header>
  );
}
