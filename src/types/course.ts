export interface Instructor {
  name: string;
  avatarUrl: string;
  bio: string;
}

export interface Course {
  slug: string;
  title: string;
  thumbnailUrl: string;
  description?: string;
  instructors: Instructor[];
  tags: string[];
  isFree: boolean;
  durationMinutes: number;
  status: string;
}

export interface CourseDetails extends Course {
  introduction?: {
    title: string;
    description: string;
    durationMinutes: number;
    provider: string;
    videoId: string;
  };
  modules: Module[];
}

export interface Module {
  slug: string;
  title: string;
  description?: string;
  position?: number;
  durationMinutes?: number;
  lessonsCount?: number;
  lessons?: Lesson[];
}

export interface ModuleDetails {
  courseSlug: string;
  module: Module;
}

export interface LessonFile {
  name: string;
  url: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
}

export interface Lesson {
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  provider: string;
  videoId?: string;
  content?: string;
  files?: LessonFile[];
}
