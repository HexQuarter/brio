import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  startTime: Date;
  endTime: Date;
  onExpire?: () => void;
}

export default function CountdownTimer({ startTime, endTime, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = now.getTime() < startTime.getTime() ? startTime.getTime() - now.getTime() : endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Poll Closed');
        onExpire?.();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const indication = now.getTime() < startTime.getTime() ? 'before to start' : 'remaining'

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${indication}`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s ${indication}`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s ${indication}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  const progress = computeProgress(startTime, endTime)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-2 text-lg text-foreground">
        <Clock className="w-5 h-5 text-primary" />
        <span className="font-mono" data-testid="text-time-remaining">{timeLeft}</span>
      </div>
      { (progress > 0 && progress < 100) &&
        <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      }
    </div>
  );
}

function computeProgress(startTime: Date, endTime: Date) {
  const now = Date.now();
  const start = startTime.getTime();
  const end = endTime.getTime();

  if (now < start) {
    return 0
  }

  if (now <= end) {
    // Progress from startTime → endTime
    const total = end - start;
    const elapsed = now - start;
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  }

  // After endTime
  return 100;
}