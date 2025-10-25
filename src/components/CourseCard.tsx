import { Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Course } from "@/types/course";
import { Link } from "react-router-dom";
import { getFullImageUrl } from "@/lib/utils";

interface CourseCardProps {
  course: Course;
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const hours = Math.floor(course.durationMinutes / 60);
  const minutes = course.durationMinutes % 60;
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <Link to={`/courses/${course.slug}`}>
      <Card className="group overflow-hidden border-border bg-card hover:bg-card-hover transition-all duration-300 hover:shadow-glow cursor-pointer">
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={getFullImageUrl(course.thumbnailUrl)}
            alt={course.slug}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            {course.isFree && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                Gratuito
              </Badge>
            )}
            {course.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-border">
                {tag}
              </Badge>
            ))}
          </div>
          <h3 className="font-semibold text-lg mb-3 line-clamp-2">
            {course.slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>
                {course.instructors[0]?.name}
                {course.instructors.length > 1 && "..."}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{durationText}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
