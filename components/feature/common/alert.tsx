'use client';

interface AlertProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose?: () => void;
}

export default function Alert({ message, type = 'info', onClose }: AlertProps) {
  const bgColor = {
    error: 'bg-red-500',
    success: 'bg-green-500',
    info: 'bg-blue-500'
  }[type];

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up`}>
      <span>{message}</span>
      {onClose && (
        <button 
          onClick={onClose}
          className="ml-2 hover:opacity-70"
        >
          ✕
        </button>
      )}
    </div>
  );
}