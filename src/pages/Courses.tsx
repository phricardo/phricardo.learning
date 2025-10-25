import { useQuery } from "@tanstack/react-query";
import { CourseCard } from "@/components/CourseCard";
import { Course } from "@/types/course";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";
import { useState } from "react";
import { API_V1_BASE_URL } from "@/config/api";

interface CoursesResponse {
  page: number;
  limit: number;
  totalCourses: number;
  totalPages: number;
  courses: Course[];
}

const fetchCourses = async (
  page: number,
  limit: number
): Promise<CoursesResponse> => {
  const response = await fetch(
    `${API_V1_BASE_URL}/courses?page=${page}&limit=${limit}`
  );
  if (!response.ok) throw new Error("Failed to fetch courses");
  return response.json();
};

const Courses = () => {
  const [page, setPage] = useState(1);
  const limit = 6;

  const { data, isLoading, error } = useQuery({
    queryKey: ["courses", page, limit],
    queryFn: () => fetchCourses(page, limit),
  });

  const courses = data?.courses || [];
  const totalPages = data?.totalPages || 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {courses.length > 0
            ? courses.map((course) => (
                <CourseCard key={course.slug} course={course} />
              ))
            : !isLoading && (
                <p className="col-span-full text-center text-muted-foreground">
                  Nenhum curso encontrado
                </p>
              )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setPage((p) => p - 1)}
              disabled={!hasPrevPage || isLoading}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>

            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage || isLoading}
              className="gap-2"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
