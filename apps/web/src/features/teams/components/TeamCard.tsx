import { Users, MoreVertical } from 'lucide-react';
import { Card, CardBody } from '../../../components/ui/Card';

interface TeamCardProps {
  team: any;
  onClick: (id: string) => void;
}

export const TeamCard = ({ team, onClick }: TeamCardProps) => {
  return (
    <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onClick(team.id)}
    >
      <CardBody className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div 
                className="w-10 h-10 rounded flex items-center justify-center font-bold text-white shadow-sm"
                style={{ backgroundColor: team.color || '#3b82f6' }}
            >
              {team.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[150px]">
                  {team.name}
              </h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Users className="w-3 h-3" />
                {team._count?.memberships || 0} members
              </p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
              <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 h-10">
          {team.description || 'No description provided for this team.'}
        </p>
        <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 dark:border-slate-700 pt-4">
          <span>Owner: {team.owner?.firstName || 'Unknown'}</span>
          <span>Created: {new Date(team.createdAt).toLocaleDateString()}</span>
        </div>
      </CardBody>
    </Card>
  );
};
