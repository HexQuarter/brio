import { Card } from '@/components/ui/card';

interface DemographicData {
  ageBrackets: { label: string; count: number }[];
  genderBreakdown: { label: string; count: number }[];
  residenceBreakdown: { inCountry: number; outside: number };
}

export default function DemographicCharts({ ageBrackets, genderBreakdown, residenceBreakdown }: DemographicData) {
  const totalAge = ageBrackets.reduce((sum, item) => sum + item.count, 0);
  const totalGender = genderBreakdown.reduce((sum, item) => sum + item.count, 0);
  const totalResidence = residenceBreakdown.inCountry + residenceBreakdown.outside;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="demographic-charts">
      <Card className="p-6 space-y-4 bg-gray-50 border-gray-200 border-1 rounded-md">
        <h3 className="text-lg text-foreground">Age Distribution</h3>
        <div className="space-y-3">
          {ageBrackets.map((bracket, i) => {
            const percentage = totalAge > 0 ? Math.round((bracket.count / totalAge) * 100) : 0;
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{bracket.label}</span>
                  <span className="font-medium text-foreground">{percentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/80 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 space-y-4 bg-gray-50 border-gray-200 border-1 rounded-md">
        <h3 className="text-lg text-foreground">Gender Breakdown</h3>
        <div className="space-y-3">
          {genderBreakdown.map((item, i) => {
            const percentage = totalGender > 0 ? Math.round((item.count / totalGender) * 100) : 0;
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{percentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-chart-2/80 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 space-y-4 md:col-span-2 bg-gray-50 border-gray-200 border-1 rounded-md">
        <h3 className="text-lg text-foreground">Residence</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">In Country</span>
              <span className="font-medium text-foreground">
                {totalResidence > 0 ? Math.round((residenceBreakdown.inCountry / totalResidence) * 100) : 0}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-chart-1/80 transition-all duration-500"
                style={{
                  width: `${totalResidence > 0 ? (residenceBreakdown.inCountry / totalResidence) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Outside</span>
              <span className="font-medium text-foreground">
                {totalResidence > 0 ? Math.round((residenceBreakdown.outside / totalResidence) * 100) : 0}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-chart-4/80 transition-all duration-500"
                style={{
                  width: `${totalResidence > 0 ? (residenceBreakdown.outside / totalResidence) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
