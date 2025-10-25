import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { CourseDetails, ModuleDetails } from "@/types/course";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Play,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  CheckCircle,
  Menu,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_V1_BASE_URL } from "@/config/api";
import Markdown from "markdown-to-jsx";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface LessonData {
  provider: string;
  videoId?: string;
  content?: string;
  title: string;
  durationMinutes: number;
  description: string;
  files?: Array<{
    name: string;
    url: string;
    mimeType?: string | null;
    sizeBytes?: number | null;
  }>;
}

const LessonContent = ({ lesson }: { lesson: LessonData }) => {
  if (lesson.provider === "YOUTUBE" && lesson.videoId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${lesson.videoId}`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (lesson.provider === "TEXT" && lesson.content) {
    return (
      <div className="w-full h-full overflow-auto bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">
            {lesson.title}
          </h1>
          <div className="markdown-content text-foreground text-base">
            <Markdown>{lesson.content}</Markdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-foreground">
      <div className="text-center">
        <Play className="w-16 h-16 mx-auto mb-4 text-primary" />
        <p className="text-xl">Conteúdo não disponível</p>
      </div>
    </div>
  );
};

const fetchCourseDetails = async (slug: string): Promise<CourseDetails> => {
  const response = await fetch(
    `${API_V1_BASE_URL}/courses/${slug}`
  );
  if (!response.ok) throw new Error("Failed to fetch course");
  return response.json();
};

const fetchModuleDetails = async (
  courseSlug: string,
  moduleSlug: string
): Promise<ModuleDetails> => {
  const response = await fetch(
    `${API_V1_BASE_URL}/courses/${courseSlug}/modules/${moduleSlug}`
  );
  if (!response.ok) throw new Error("Failed to fetch module");
  return response.json();
};

const CoursePlayer = () => {
  const { slug } = useParams<{ slug: string }>();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<{
    moduleSlug: string;
    lessonSlug: string;
  } | null>(null);
  const [currentLessonData, setCurrentLessonData] = useState<LessonData | null>(
    null
  );
  const [isCompletingLesson, setIsCompletingLesson] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseDetails(slug!),
    enabled: !!slug,
  });

  const { data: moduleDetails } = useQuery({
    queryKey: ["module", slug, expandedModule],
    queryFn: () => fetchModuleDetails(slug!, expandedModule!),
    enabled: !!slug && !!expandedModule,
  });

  // Auto-expand first module and select first lesson
  useEffect(() => {
    if (course && !expandedModule) {
      const firstModule = course.modules[0];
      if (firstModule) {
        setExpandedModule(firstModule.slug);
      }
    }
  }, [course, expandedModule]);

  // Auto-select first lesson when first module loads
  useEffect(() => {
    if (moduleDetails && !currentLessonData) {
      const firstLesson = moduleDetails.module.lessons[0];
      if (firstLesson) {
        setCurrentLesson({
          moduleSlug: moduleDetails.module.slug,
          lessonSlug: firstLesson.slug,
        });
        setCurrentLessonData({
          provider: firstLesson.provider,
          videoId: firstLesson.videoId,
          content: firstLesson.content,
          title: firstLesson.title,
          durationMinutes: firstLesson.durationMinutes,
          description: firstLesson.description,
          files: firstLesson.files,
        });
      }
    }
  }, [moduleDetails, currentLessonData]);

  const handleModuleClick = (moduleSlug: string) => {
    setExpandedModule(expandedModule === moduleSlug ? null : moduleSlug);
  };

  const handleLessonClick = (moduleSlug: string, lessonSlug: string) => {
    setCurrentLesson({ moduleSlug, lessonSlug });
    const lesson = moduleDetails?.module.lessons.find(
      (l) => l.slug === lessonSlug
    );
    if (lesson) {
      setCurrentLessonData({
        provider: lesson.provider,
        videoId: lesson.videoId,
        content: lesson.content,
        title: lesson.title,
        durationMinutes: lesson.durationMinutes,
        description: lesson.description,
        files: lesson.files,
      });
    }
  };

  const canNavigatePrev = () => {
    if (!course || !currentLesson) return false;

    const currentModuleIndex = course.modules.findIndex(
      (m) => m.slug === currentLesson.moduleSlug
    );
    if (currentModuleIndex === -1) return false;

    // If not in first module, can always go back
    if (currentModuleIndex > 0) return true;

    // If in first module, check if not in first lesson
    if (
      moduleDetails &&
      moduleDetails.module.slug === currentLesson.moduleSlug
    ) {
      const currentLessonIndex = moduleDetails.module.lessons.findIndex(
        (l) => l.slug === currentLesson.lessonSlug
      );
      return currentLessonIndex > 0;
    }

    return false;
  };

  const canNavigateNext = () => {
    if (!course || !currentLesson) return false;

    const currentModuleIndex = course.modules.findIndex(
      (m) => m.slug === currentLesson.moduleSlug
    );
    if (currentModuleIndex === -1) return false;

    // If not in last module, can always go forward
    if (currentModuleIndex < course.modules.length - 1) return true;

    // If in last module, check if not in last lesson
    if (
      moduleDetails &&
      moduleDetails.module.slug === currentLesson.moduleSlug
    ) {
      const currentLessonIndex = moduleDetails.module.lessons.findIndex(
        (l) => l.slug === currentLesson.lessonSlug
      );
      return currentLessonIndex < moduleDetails.module.lessons.length - 1;
    }

    return false;
  };

  const navigateLesson = (direction: "prev" | "next") => {
    if (!course || !currentLesson) return;

    // Find current module index and lesson index
    const currentModuleIndex = course.modules.findIndex(
      (m) => m.slug === currentLesson.moduleSlug
    );
    if (currentModuleIndex === -1) return;

    // We need to fetch the current module details to get lessons
    fetchModuleDetails(slug!, currentLesson.moduleSlug).then(
      (currentModuleData) => {
        const currentLessonIndex = currentModuleData.module.lessons.findIndex(
          (l) => l.slug === currentLesson.lessonSlug
        );

        if (direction === "next") {
          // Check if there's a next lesson in current module
          if (
            currentLessonIndex <
            currentModuleData.module.lessons.length - 1
          ) {
            const nextLesson =
              currentModuleData.module.lessons[currentLessonIndex + 1];
            setCurrentLesson({
              moduleSlug: currentLesson.moduleSlug,
              lessonSlug: nextLesson.slug,
            });
            setCurrentLessonData({
              provider: nextLesson.provider,
              videoId: nextLesson.videoId,
              content: nextLesson.content,
              title: nextLesson.title,
              durationMinutes: nextLesson.durationMinutes,
              description: nextLesson.description,
              files: nextLesson.files,
            });
          } else if (currentModuleIndex < course.modules.length - 1) {
            // Move to first lesson of next module
            const nextModule = course.modules[currentModuleIndex + 1];
            setExpandedModule(nextModule.slug);
            fetchModuleDetails(slug!, nextModule.slug).then(
              (nextModuleData) => {
                if (nextModuleData.module.lessons.length > 0) {
                  const firstLesson = nextModuleData.module.lessons[0];
                  setCurrentLesson({
                    moduleSlug: nextModule.slug,
                    lessonSlug: firstLesson.slug,
                  });
                  setCurrentLessonData({
                    provider: firstLesson.provider,
                    videoId: firstLesson.videoId,
                    content: firstLesson.content,
                    title: firstLesson.title,
                    durationMinutes: firstLesson.durationMinutes,
                    description: firstLesson.description,
                    files: firstLesson.files,
                  });
                }
              }
            );
          }
        } else {
          // Check if there's a previous lesson in current module
          if (currentLessonIndex > 0) {
            const prevLesson =
              currentModuleData.module.lessons[currentLessonIndex - 1];
            setCurrentLesson({
              moduleSlug: currentLesson.moduleSlug,
              lessonSlug: prevLesson.slug,
            });
            setCurrentLessonData({
              provider: prevLesson.provider,
              videoId: prevLesson.videoId,
              content: prevLesson.content,
              title: prevLesson.title,
              durationMinutes: prevLesson.durationMinutes,
              description: prevLesson.description,
              files: prevLesson.files,
            });
          } else if (currentModuleIndex > 0) {
            // Move to last lesson of previous module
            const prevModule = course.modules[currentModuleIndex - 1];
            setExpandedModule(prevModule.slug);
            fetchModuleDetails(slug!, prevModule.slug).then(
              (prevModuleData) => {
                if (prevModuleData.module.lessons.length > 0) {
                  const lastLesson =
                    prevModuleData.module.lessons[
                      prevModuleData.module.lessons.length - 1
                    ];
                  setCurrentLesson({
                    moduleSlug: prevModule.slug,
                    lessonSlug: lastLesson.slug,
                  });
                  setCurrentLessonData({
                    provider: lastLesson.provider,
                    videoId: lastLesson.videoId,
                    content: lastLesson.content,
                    title: lastLesson.title,
                    durationMinutes: lastLesson.durationMinutes,
                    description: lastLesson.description,
                    files: lastLesson.files,
                  });
                }
              }
            );
          }
        }
      }
    );
  };

  const handleCompleteLesson = async () => {
    if (!slug || !currentLesson) return;

    setIsCompletingLesson(true);
    try {
      const response = await fetch(
        `${API_V1_BASE_URL}/courses/${slug}/modules/${currentLesson.moduleSlug}/lessons/${currentLesson.lessonSlug}/complete`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (response.status === 204 || response.ok) {
        toast.success("Aula concluída com sucesso!");
      } else {
        toast.error("Erro ao completar a aula");
      }
    } catch (error) {
      console.error("Error completing lesson:", error);
      toast.error("Erro ao completar a aula");
    } finally {
      setIsCompletingLesson(false);
    }
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Curso não encontrado</p>
      </div>
    );
  }

  const renderModulesList = () => (
    <div className="space-y-2">
      {course.modules.map((module, index) => (
        <div key={module.slug}>
          <Card
            className="p-4 cursor-pointer border-border hover:bg-card-hover transition-colors"
            onClick={() => handleModuleClick(module.slug)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-primary font-semibold mb-1">
                  Módulo {index + 1}
                </p>
                <h3 className="font-semibold text-sm mb-1">{module.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {module.lessons?.length || 0} aulas •{" "}
                  {module.lessons?.reduce(
                    (acc, lesson) => acc + lesson.durationMinutes,
                    0
                  ) || 0}{" "}
                  min
                </p>
              </div>
              {expandedModule === module.slug ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </Card>

          {expandedModule === module.slug && moduleDetails && (
            <div className="ml-4 mt-2 space-y-2">
              {moduleDetails.module.lessons.map((lesson) => (
                <Card
                  key={lesson.slug}
                  className={cn(
                    "p-3 cursor-pointer border-border transition-colors",
                    currentLesson?.lessonSlug === lesson.slug
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-card-hover"
                  )}
                  onClick={() => {
                    handleLessonClick(module.slug, lesson.slug);
                    if (isMobile) setIsMobileMenuOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Play className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{lesson.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {lesson.durationMinutes} min
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="px-4 md:px-6 py-4 flex items-center gap-4">
          {isMobile && (
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold">Conteúdo do Curso</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {course.modules.length} módulos
                  </p>
                </div>
                <ScrollArea className="h-[calc(100vh-80px)]">
                  <div className="p-4">{renderModulesList()}</div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/courses/${slug}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao curso
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Lesson Content */}
          <div
            className={cn(
              "relative",
              currentLessonData?.provider === "TEXT"
                ? "min-h-[600px]"
                : "aspect-video bg-black"
            )}
          >
            {currentLessonData ? (
              <LessonContent lesson={currentLessonData} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-foreground">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 text-primary" />
                  <p className="text-xl">Selecione uma aula para começar</p>
                </div>
              </div>
            )}
          </div>

          {/* Lesson Info */}
          <div className="p-4 md:p-6 border-b border-border">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              {currentLessonData?.provider !== "TEXT" && (
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-bold mb-2">
                    {currentLessonData?.title}
                  </h1>
                  <p className="text-muted-foreground">
                    {currentLessonData?.durationMinutes} minutos
                  </p>
                </div>
              )}
              <div
                className={cn(
                  "flex flex-wrap items-center gap-2 w-full md:w-auto",
                  currentLessonData?.provider === "TEXT" && "md:ml-auto"
                )}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateLesson("prev")}
                  disabled={!canNavigatePrev()}
                  className="flex-1 md:flex-none"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCompleteLesson}
                  disabled={isCompletingLesson}
                  className="flex-1 md:flex-none"
                >
                  {isCompletingLesson ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Completar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateLesson("next")}
                  disabled={!canNavigateNext()}
                  className="flex-1 md:flex-none"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          {/* Lesson Description */}
          {currentLessonData?.description &&
            currentLessonData.provider !== "TEXT" && (
              <ScrollArea className="flex-1 overflow-auto">
                <div className="p-4 md:p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Sobre esta aula
                  </h2>
                  <div className="markdown-content text-foreground">
                    <Markdown>{currentLessonData.description}</Markdown>
                  </div>
                </div>
              </ScrollArea>
            )}

          {/* Lesson Files */}
          {currentLessonData?.files && currentLessonData.files.length > 0 && (
            <div className="p-4 md:p-6 border-t border-border">
              <h2 className="text-xl font-semibold mb-4">Arquivos da aula</h2>
              <div className="space-y-2">
                {currentLessonData.files.map((file, index) => (
                  <Card key={index} className="p-4">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-4 hover:opacity-80 transition-opacity group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="font-medium">{file.name}</span>
                      </div>
                      <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Desktop only */}
        <Card className="hidden md:flex w-96 border-l border-border rounded-none bg-card flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Conteúdo do Curso</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {course.modules.length} módulos
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">{renderModulesList()}</div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default CoursePlayer;
