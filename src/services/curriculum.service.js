import prisma from '../prisma.js';
import { createNotification } from './notification.service.js';
import { getApprovedStudentIds } from './subscription.service.js';

// --- STAGES ---
export const getStages = async () => {
  return prisma.stage.findMany({
    include: {
      grades: {
        include: {
          subjects: {
            include: { units: true }
          }
        }
      }
    }
  });
};

export const createStage = async (name) => {
  return prisma.stage.create({ data: { name } });
};

// --- GRADES ---
export const createGrade = async (name, stageId) => {
  return prisma.grade.create({ data: { name, stageId } });
};

// --- SUBJECTS ---
export const createSubject = async (name, gradeId) => {
  return prisma.subject.create({ data: { name, gradeId } });
};

export const getSubject = async (id, userId) => {
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      units: {
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              createdAt: true,
              published: true, // Need to know status
              isDeleted: true,
              progress: {
                where: { userId: userId || 'no-user' },
                select: { completed: true }
              }
            }
          }
        }
      }
    }
  });

  if (!subject) return null;

  // Transform structure to flatten progress
  const units = subject.units.map(unit => ({
    ...unit,
    lessons: unit.lessons
      .filter(lesson => !lesson.isDeleted)
      .map(lesson => ({
        ...lesson,
        completed: lesson.progress?.[0]?.completed || false,
        progress: undefined // remove raw array
      }))
    // Filter: If I am a student, I should only see published?
    // Wait, 'userId' here is generic. We need role too.
    // For now, let's return everything and let Controller filter or Frontend filter.
    // Actually, safer to filter here if we had role.
    // Let's just expose 'published' field and filter in Controller if needed.
  }));

  return { ...subject, units };
};

// --- UNITS ---
export const createUnit = async (name, subjectId) => {
  return prisma.unit.create({ data: { name, subjectId } });
};

// --- LESSONS ---
export const createLesson = async (data) => {
  const { title, unitId, teacherId, content, videoUrl, pdfUrl } = data;
  const lesson = await prisma.lesson.create({
    data: {
      title,
      unitId,
      teacherId,
      content,
      videoUrl,
      pdfUrl,
      published: data.published || false
    },
    include: { teacher: { select: { name: true } } }
  });

  // Notify students if published
  if (lesson.published) {
    const studentIds = await getApprovedStudentIds(teacherId);
    await Promise.all(studentIds.map(sid =>
      createNotification(sid, {
        title: 'New Lesson Available',
        message: `Teacher ${lesson.teacher.name} added a new lesson: ${lesson.title}`,
        type: 'CONTENT',
        link: `/student/lessons/${lesson.id}`
      })
    ));
  }

  return lesson;
};





export const getLessons = async () => {
  return prisma.lesson.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      title: true
    },
    orderBy: { title: 'asc' }
  });
};

export const getLesson = async (id, userId) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      unit: true,
      teacher: { select: { name: true } },
      quiz: { select: { id: true, title: true } }
    }
  });

  if (!lesson || lesson.isDeleted) return null;

  // Check progress
  let progress = null;
  if (userId) {
    progress = await prisma.studentLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: id } }
    });
  }

  return { ...lesson, completed: progress?.completed || false };
};

export const getTeacherStats = async (teacherId) => {
  const [lessonCount, quizCount, studentCount] = await Promise.all([
    prisma.lesson.count({ where: { teacherId } }),
    prisma.quiz.count({ where: { teacherId } }),
    prisma.user.count({ where: { role: 'STUDENT' } }) // Total students in platform for now
  ]);

  return {
    lessons: lessonCount,
    quizzes: quizCount,
    students: studentCount
  };
};

// --- PROGRESS ---
export const markLessonComplete = async (userId, lessonId) => {
  return prisma.studentLessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId,
        lessonId
      }
    },
    update: {
      completed: true,
      lastViewedAt: new Date()
    },
    create: {
      userId,
      lessonId,
      completed: true
    }
  });
};
