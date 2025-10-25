import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { CourseDetails as CourseDetailsType } from "@/types/course";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Play, BookOpen, ArrowLeft } from "lucide-react";
import { Loader2 } from "lucide-react";
import { getFullImageUrl } from "@/lib/utils";
import { API_V1_BASE_URL } from "@/config/api";

const fetchCourseDetails = async (slug: string): Promise<CourseDetailsType> => {
  const response = await fetch(
    `${API_V1_BASE_URL}/courses/${slug}`
  );
  if (!response.ok) throw new Error("Failed to fetch course details");
  return response.json();
};

const CourseDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseDetails(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Erro ao carregar detalhes do curso</p>
      </div>
    );
  }

  const totalHours = Math.floor(course.durationMinutes / 60);
  const totalMinutes = course.durationMinutes % 60;
  const totalDuration =
    totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes}m`;
  const safeSlug = slug ?? course.slug;
  const firstModuleSlug = course.modules[0]?.slug;
  const firstLessonSlug = course.modules[0]?.lessons?.[0]?.slug;
  const coursePlayerPath =
    firstModuleSlug && firstLessonSlug
      ? `/courses/${safeSlug}/${firstModuleSlug}/${firstLessonSlug}`
      : `/courses/${safeSlug}/learn`;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/">
          <Button
            variant="ghost"
            className="mb-6 w-full justify-center sm:w-auto sm:justify-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao catálogo
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="aspect-video rounded-lg overflow-hidden bg-black mb-6 shadow-card">
              {course.introduction?.videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${course.introduction.videoId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img
                  src={getFullImageUrl(course.thumbnailUrl)}
                  alt={course.slug}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
              {course.isFree && (
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                  Gratuito
                </Badge>
              )}
              {course.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
              {course.slug
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </h1>

            <div className="mb-8 flex flex-wrap items-center gap-4 text-muted-foreground sm:gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{totalDuration}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{course.modules.length} módulos</span>
              </div>
            </div>

            {course.introduction?.title && course.introduction?.description && (
              <Card className="p-6 bg-card border-border mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  {course.introduction.title}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {course.introduction.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{course.introduction.durationMinutes} minutos</span>
                </div>
              </Card>
            )}

            <div>
              <h2 className="text-2xl font-semibold mb-6">Módulos do Curso</h2>
              <div className="space-y-4">
                {course.modules.map((module, index) => (
                  <Card
                    key={module.slug}
                    className="p-4 bg-card border-border hover:bg-card-hover transition-colors sm:p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-sm font-semibold text-primary">
                            Módulo {index + 1}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {(module as any).lessonsCount ||
                              module.lessons?.length ||
                              0}{" "}
                            {((module as any).lessonsCount ||
                              module.lessons?.length ||
                              0) === 1
                              ? "aula"
                              : "aulas"}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold mb-1">
                          {module.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>
                            {(() => {
                              const minutes =
                                (module as any).durationMinutes ||
                                module.lessons?.reduce(
                                  (acc, lesson) => acc + lesson.durationMinutes,
                                  0
                                ) ||
                                0;
                              const hours = Math.floor(minutes / 60);
                              const mins = minutes % 60;
                              return hours > 0
                                ? `${hours}h ${mins}m`
                                : `${mins}m`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 lg:col-span-1 lg:mt-0">
            <Card className="p-6 bg-card border-border lg:sticky lg:top-8">
              <h3 className="text-xl font-semibold mb-4">Sobre o curso</h3>
              <div className="space-y-4 mb-6">
                {course.isFree && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Preço</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                      Gratuito
                    </Badge>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Duração</span>
                  <span className="font-medium">{totalDuration}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Módulos</span>
                  <span className="font-medium">{course.modules.length}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Aulas</span>
                  <span className="font-medium">
                    {course.modules.reduce(
                      (acc, m) =>
                        acc +
                        ((m as any).lessonsCount || m.lessons?.length || 0),
                      0
                    )}
                  </span>
                </div>
                <div className="py-2">
                  <span className="text-muted-foreground block mb-3">
                    Instrutores
                  </span>
                  <div className="space-y-3">
                    {course.instructors.map((instructor) => (
                      <div
                        key={instructor.name}
                        className="flex items-start gap-3"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={getFullImageUrl(instructor.avatarUrl)}
                            alt={instructor.name}
                          />
                          <AvatarFallback>
                            {instructor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {instructor.name}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {instructor.bio}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Link to={coursePlayerPath}>
                <Button className="w-full bg-gradient-primary hover:shadow-glow transition-all">
                  <Play className="w-4 h-4 mr-2" />
                  Começar Curso
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
