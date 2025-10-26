import { useQuery } from "@tanstack/react-query";
import { CourseCard } from "@/components/CourseCard";
import { Course } from "@/types/course";
import { Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";
import { useState } from "react";
import { API_V1_BASE_URL } from "@/config/api";
import { CourseApiCourse, mapCourseFromApi } from "@/lib/course-api";
import { Input } from "@/components/ui/input";

interface CatalogApiResponse {
  content?: CourseApiCourse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

interface CoursesResponse {
  page: number;
  limit: number;
  totalCourses: number;
  totalPages: number;
  courses: Course[];
}

const fetchCourses = async (
  page: number,
  limit: number,
  courseName: string
): Promise<CoursesResponse> => {
  const searchParams = new URLSearchParams({
    page: String(Math.max(page - 1, 0)),
    size: String(limit),
  });

  if (courseName.trim()) {
    searchParams.set("courseName", courseName.trim());
  }

  const response = await fetch(
    `${API_V1_BASE_URL}/courses?${searchParams.toString()}`
  );
  if (!response.ok) throw new Error("Failed to fetch courses");

  const data: CatalogApiResponse = await response.json();
  const content = Array.isArray(data.content) ? data.content : [];

  return {
    page: data.page + 1,
    limit: data.size,
    totalCourses: data.totalElements,
    totalPages: data.totalPages || 1,
    courses: content.map(mapCourseFromApi),
  };
};

const Courses = () => {
  const [page, setPage] = useState(1);
  const [courseName, setCourseName] = useState("");
  const limit = 10;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["courses", page, limit, courseName],
    queryFn: () => fetchCourses(page, limit, courseName),
  });

  const isInitialLoading = isLoading && !data;
  const courses = data?.courses || [];
  const totalPages = data?.totalPages || 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  const showGridLoader = isFetching && !isInitialLoading;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Erro ao carregar cursos</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <img src={logo} alt="DomCharia" className="h-8 brightness-0 invert" />
        </div>
      </header>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 text-foreground">Catálogo</h1>
          <p className="text-muted-foreground text-lg">
            Explore nossa seleção de cursos :)
          </p>
        </div>
        <div className="mb-10">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Filtrar por nome
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Digite o nome do curso"
              value={courseName}
              onChange={(event) => {
                setPage(1);
                setCourseName(event.target.value);
              }}
              className="pl-9"
            />
          </div>
        </div>

        <div className="relative mb-8 min-h-[200px]">
          <div
            className={
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" +
              (showGridLoader ? " opacity-50 pointer-events-none" : "")
            }
          >
            {courses.length > 0
              ? courses.map((course) => (
                  <CourseCard key={course.slug} course={course} />
                ))
              : !isInitialLoading && (
                  <p className="col-span-full text-center text-muted-foreground">
                    Nenhum curso encontrado
                  </p>
                )}
          </div>

          {showGridLoader && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrevPage || isFetching || isInitialLoading}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          <span className="text-sm text-muted-foreground">
            Pǭgina {page} de {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNextPage || isFetching || isInitialLoading}
            className="gap-2"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Courses;
