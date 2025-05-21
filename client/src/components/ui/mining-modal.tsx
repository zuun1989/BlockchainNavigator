import { Progress } from "@/components/ui/progress";

interface MiningModalProps {
  isOpen: boolean;
  progress: number;
  hashAttempt: string;
}

export function MiningModal({ isOpen, progress, hashAttempt }: MiningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Mining Block...</h3>
          <Progress value={progress} className="h-2.5 mb-4" />
          <p className="text-sm text-gray-500 mb-4">
            Finding a valid hash that satisfies the difficulty requirement...
          </p>
          <div className="font-mono text-xs text-gray-600 mb-4 overflow-x-auto p-2 bg-gray-50 rounded">
            <div>Trying hash: {hashAttempt}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
