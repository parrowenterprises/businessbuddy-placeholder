import { useState, useEffect } from 'react';
import { PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import type { TimeEntry } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface TimeTrackerProps {
  jobId: string;
  onTimeEntryCreated: (entry: TimeEntry) => void;
}

export default function TimeTracker({ jobId, onTimeEntryCreated }: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && currentEntry) {
      interval = setInterval(() => {
        const startTime = new Date(currentEntry.start_time).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, currentEntry]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTracking = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: entry, error } = await supabase
        .from('time_entries')
        .insert([
          {
            job_id: jobId,
            user_id: user.id,
            start_time: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setCurrentEntry(entry);
      setIsTracking(true);
      setElapsedTime(0);
    } catch (error) {
      console.error('Error starting time tracking:', error);
      toast.error('Failed to start time tracking');
    }
  };

  const stopTracking = async () => {
    if (!currentEntry) return;

    try {
      const { data: entry, error } = await supabase
        .from('time_entries')
        .update({
          end_time: new Date().toISOString(),
        })
        .eq('id', currentEntry.id)
        .select()
        .single();

      if (error) throw error;

      setIsTracking(false);
      setCurrentEntry(null);
      onTimeEntryCreated(entry);
      toast.success('Time entry saved');
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      toast.error('Failed to stop time tracking');
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        type="button"
        onClick={isTracking ? stopTracking : startTracking}
        className={`
          inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
          shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
          ${isTracking
            ? 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600'
            : 'bg-green-600 text-white hover:bg-green-500 focus-visible:outline-green-600'
          }
        `}
      >
        {isTracking ? (
          <>
            <StopIcon className="h-4 w-4 mr-2" />
            Stop Timer
          </>
        ) : (
          <>
            <PlayIcon className="h-4 w-4 mr-2" />
            Start Timer
          </>
        )}
      </button>
      {isTracking && (
        <div className="text-sm font-medium">
          Time Elapsed: {formatTime(elapsedTime)}
        </div>
      )}
    </div>
  );
} 