import { MapPin, Users, TrendingUp, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Area {
  id: number;
  name: string;
  leader: string;
  cells: number;
  members: number;
  attendance: number;
}

interface AreaCardProps {
  area: Area;
  onClick: () => void;
  isSelected: boolean;
}

export const AreaCard = ({ area, onClick, isSelected }: AreaCardProps) => {
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-success";
    if (percentage >= 80) return "text-warning";
    return "text-destructive";
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] shadow-elevation",
        isSelected && "ring-2 ring-primary bg-primary/5"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-primary flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            {area.name}
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn("font-medium", getAttendanceColor(area.attendance))}
          >
            {area.attendance}%
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{area.leader}</p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-primary mr-1" />
            </div>
            <p className="text-2xl font-bold text-foreground">{area.members}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <MapPin className="h-4 w-4 text-primary mr-1" />
            </div>
            <p className="text-2xl font-bold text-foreground">{area.cells}</p>
            <p className="text-xs text-muted-foreground">Cells</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 mr-1" />
            Attendance Rate
          </div>
          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};