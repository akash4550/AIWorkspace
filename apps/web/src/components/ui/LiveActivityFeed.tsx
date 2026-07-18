import { useEffect, useState } from 'react';
import { useSocket } from '../../providers/SocketProvider';
import { Activity, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
}

export const LiveActivityFeed = () => {
  const { socket } = useSocket();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for generic activity events (mocked payload for demo)
    socket.on('activity.new', (payload: any) => {
      setActivities(prev => [
        {
          id: Math.random().toString(36).substr(2, 9),
          type: payload.type,
          message: payload.message,
          timestamp: new Date()
        },
        ...prev
      ].slice(0, 50)); // Keep last 50
    });

    // Also listen to task events as activities
    socket.on('task.created', (payload: any) => {
      setActivities(prev => [{
        id: Math.random().toString(),
        type: 'TASK_CREATED',
        message: `Task created: ${payload.taskTitle || 'Untitled'}`,
        timestamp: new Date()
      }, ...prev].slice(0, 50));
    });

    return () => {
      socket.off('activity.new');
      socket.off('task.created');
    };
  }, [socket]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
        <Activity className="w-4 h-4 text-gray-500" />
        <h3 className="font-medium text-gray-900 dark:text-white">Live Activity</h3>
      </div>
      <div className="p-4 h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
            <Clock className="w-8 h-8 opacity-20" />
            <p className="text-sm">Waiting for live activity...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 text-sm">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                <div>
                  <p className="text-gray-900 dark:text-white">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {activity.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
