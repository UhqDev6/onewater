/**
 * Reusable Spinner/Loading Component
 */

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export default function Spinner({ size = 'md', message, className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-b-2',
  };

  return (
    <div className={`text-center ${className}`}>
      <div
        className={`inline-block animate-spin rounded-full border-blue-600 ${sizeClasses[size]}`}
        style={{ borderTopColor: 'transparent' }}
      />
      {message && <p className="text-gray-600 mt-2">{message}</p>}
    </div>
  );
}
