import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Calendar, Clock, MapPin, Video, Users } from "lucide-react";

interface MatchCardProps {
  entrepreneurName: string;
  companyName?: string;
  groupName?: string;
  slotStart: string;
  slotEnd: string;
  interviewMode: "on-site" | "online";
  status: "scheduled" | "completed" | "cancelled" | "pending";
  teamsLink?: string | null;
  address?: string | null;
}

export function MatchCard({
  entrepreneurName,
  companyName,
  groupName,
  slotStart,
  slotEnd,
  interviewMode,
  status,
  teamsLink,
  address,
}: MatchCardProps) {
  const start = new Date(slotStart);
  const end = new Date(slotEnd);

  const dateStr = start.toLocaleDateString("nl-NL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = `${start.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <Card className="border-l-4 border-l-indigo-500">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            {companyName ?? entrepreneurName}
          </CardTitle>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {groupName && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{groupName}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{timeStr}</span>
        </div>
        <div className="flex items-center gap-2">
          {interviewMode === "online" ? (
            <Video className="h-4 w-4" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          <span className="capitalize">{interviewMode}</span>
          {interviewMode === "online" && teamsLink && (
            <a
              href={teamsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 underline hover:text-indigo-800 ml-1"
            >
              Join Teams
            </a>
          )}
          {interviewMode === "on-site" && address && (
            <span className="ml-1">— {address}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
