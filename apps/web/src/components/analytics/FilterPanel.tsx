import { Card, Select, SelectItem, DateRangePicker } from '@tremor/react';

interface FilterPanelProps {
  onDateChange: (dateRange: { from?: Date; to?: Date }) => void;
  onProjectChange?: (projectId: string) => void;
  onTeamChange?: (teamId: string) => void;
  projects?: { id: string; name: string }[];
  teams?: { id: string; name: string }[];
}

export const FilterPanel = ({
  onDateChange,
  onProjectChange,
  onTeamChange,
  projects,
  teams,
}: FilterPanelProps) => {
  return (
    <Card className="mb-6 py-4 px-6 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-4 w-full md:w-auto">
        {projects && onProjectChange && (
          <div className="w-full md:w-64">
            <Select placeholder="Filter by Project" onValueChange={onProjectChange}>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p: { id: string; name: string }) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </Select>
          </div>
        )}

        {teams && onTeamChange && (
          <div className="w-full md:w-64">
            <Select placeholder="Filter by Team" onValueChange={onTeamChange}>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((t: { id: string; name: string }) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="w-full md:w-auto">
        <DateRangePicker 
          className="max-w-md mx-auto" 
          onValueChange={(value: { from?: Date; to?: Date }) => onDateChange(value)}
          enableSelect={false}
        />
      </div>
    </Card>
  );
};
