import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";

interface NotificationProps {
  show: boolean;
  type: "success" | "error" | "warning";
  title: string;
  message: string;
  onClose: () => void;
}

export function Notification({
  show,
  type,
  title,
  message,
  onClose,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isVisible && !show) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="text-green-500 text-xl" />;
      case "error":
        return <XCircle className="text-red-500 text-xl" />;
      case "warning":
        return <AlertTriangle className="text-orange-500 text-xl" />;
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out ${
        show ? "translate-y-0" : "translate-y-10"
      }`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-500">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
