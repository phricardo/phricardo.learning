import { Course, CourseDetails, Lesson, Module } from "@/types/course";

export interface CourseApiInstructor {
  name?: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface CourseApiLesson {
  slug: string;
  title?: string;
  description?: string;
  durationMinutes?: number;
  provider?: string;
  videoId?: string;
  content?: string;
  files?: Lesson["files"];
}

export interface CourseApiModule {
  slug: string;
  title: string;
  description?: string;
  position?: number;
  durationMinutes?: number;
  lessonsCount?: number;
  lessons?: CourseApiLesson[];
}

export interface CourseApiCourse {
  slug: string;
  name?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  tags?: string[];
  instructors?: CourseApiInstructor[];
  isFree?: boolean;
  durationMinutes?: number;
  status?: string;
  introduction?: CourseDetails["introduction"];
  modules?: CourseApiModule[];
}

const mapInstructorFromApi = (instructor: CourseApiInstructor) => ({
  name: instructor.name ?? instructor.username ?? "Instrutor(a)",
  avatarUrl: instructor.avatarUrl ?? "",
  bio: instructor.bio ?? "",
});

const mapLessonFromApi = (lesson: CourseApiLesson): Lesson => ({
  slug: lesson.slug,
  title: lesson.title ?? lesson.slug,
  description: lesson.description ?? "",
  durationMinutes: lesson.durationMinutes ?? 0,
  provider: lesson.provider ?? "TEXT",
  videoId: lesson.videoId,
  content: lesson.content,
  files: lesson.files,
});

export const mapModuleFromApi = (module: CourseApiModule): Module => {
  const lessons = module.lessons?.map(mapLessonFromApi) ?? [];
  const durationFromLessons = lessons.reduce(
    (total, lesson) => total + lesson.durationMinutes,
    0
  );

  return {
    slug: module.slug,
    title: module.title,
    description: module.description,
    position: module.position,
    durationMinutes: module.durationMinutes ?? durationFromLessons,
    lessonsCount: module.lessonsCount ?? lessons.length,
    lessons,
  };
};

export const mapCourseFromApi = (course: CourseApiCourse): Course => ({
  slug: course.slug,
  title: course.name ?? course.title ?? course.slug,
  description: course.description,
  thumbnailUrl: course.thumbnailUrl ?? course.thumbnail ?? "",
  instructors: course.instructors?.map(mapInstructorFromApi) ?? [],
  tags: course.tags ?? [],
  isFree: course.isFree ?? false,
  durationMinutes: course.durationMinutes ?? 0,
  status: course.status ?? "PUBLISHED",
});

export const mapCourseDetailsFromApi = (
  course: CourseApiCourse
): CourseDetails => ({
  ...mapCourseFromApi(course),
  introduction: course.introduction,
  modules: course.modules?.map(mapModuleFromApi) ?? [],
});
