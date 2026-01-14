import prisma from '../prisma.js';

export const subscribe = async (studentId, teacherId) => {
  return prisma.subscription.create({
    data: {
      studentId,
      teacherId
    }
  });
};

export const unsubscribe = async (studentId, teacherId) => {
  return prisma.subscription.deleteMany({
    where: {
      studentId,
      teacherId
    }
  });
};

export const getMyTeachers = async (studentId) => {
  return prisma.subscription.findMany({
    where: { studentId },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
          createdLessons: { select: { id: true } }, // Count
          createdQuizzes: { select: { id: true } }  // Count
        }
      }
    }
  });
};

export const getAllTeachers = async (studentId) => {
  // Get all teachers and check if subscribed
  const teachers = await prisma.user.findMany({
    where: { role: 'TEACHER' },
    select: {
      id: true,
      name: true,
      email: true,
      createdLessons: { select: { id: true } },
      createdQuizzes: { select: { id: true } }
    }
  });

  const mySubscriptions = await prisma.subscription.findMany({
    where: { studentId },
    select: { teacherId: true }
  });

  const subSet = new Set(mySubscriptions.map(s => s.teacherId));

  return teachers.map(t => ({
    ...t,
    isSubscribed: subSet.has(t.id),
    lessonCount: t.createdLessons.length,
    quizCount: t.createdQuizzes.length
  }));
};

export const getSubscribedLessons = async (studentId) => {
  // Find all teachers I follow
  const subscriptions = await prisma.subscription.findMany({
    where: { studentId },
    select: { teacherId: true }
  });
  
  const teacherIds = subscriptions.map(s => s.teacherId);
  
  // Find lessons by these teachers (only published and not deleted)
  return prisma.lesson.findMany({
    where: { 
      teacherId: { in: teacherIds },
      published: true,
      isDeleted: false
    },
    include: { teacher: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

export const getSubscribedQuizzes = async (studentId) => {
  const subscriptions = await prisma.subscription.findMany({
    where: { studentId },
    select: { teacherId: true }
  });
  
  const teacherIds = subscriptions.map(s => s.teacherId);
  
  // Find quizzes by these teachers (only published and not deleted)
  return prisma.quiz.findMany({
    where: { 
      teacherId: { in: teacherIds },
      published: true,
      isDeleted: false
    },
    include: { 
      teacher: { select: { name: true } },
      questions: { select: { id: true } } // just to count questions
    },
    orderBy: { createdAt: 'desc' }
  });
};

// Teacher: Get My Students (subscribed to me)
export const getMyStudents = async (teacherId, params = {}) => {
  const { page = 1, limit = 10, search = '' } = params;
  const skip = (page - 1) * limit;

  const where = {
    teacherId,
    ...(search ? {
      student: {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } }
        ]
      }
    } : {})
  };

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.subscription.count({ where })
  ]);

  const students = subscriptions.map(sub => sub.student);
  return { students, total, page, limit, pages: Math.ceil(total / limit) };
};

// Teacher: Get Student Results (only my quizzes)
export const getMyStudentsResults = async (teacherId, params = {}) => {
  const { page = 1, limit = 20, sort = 'date_desc', studentId = '', quizId = '' } = params;
  const skip = (page - 1) * limit;

  // First, get my student IDs (security: only students subscribed to me)
  const mySubscriptions = await prisma.subscription.findMany({
    where: { teacherId },
    select: { studentId: true }
  });
  const myStudentIds = mySubscriptions.map(s => s.studentId);

  if (myStudentIds.length === 0) {
    return { results: [], total: 0, page, limit, pages: 0 };
  }

  // Build where clause
  const where = {
    userId: { in: myStudentIds }, // Security: Only my students
    quiz: { teacherId }, // Security: Only my quizzes
    completedAt: { not: null },
    ...(studentId ? { userId: studentId } : {}),
    ...(quizId ? { quizId } : {})
  };

  // Determine sort order
  let orderBy = {};
  if (sort === 'score_asc') {
    orderBy = { result: { score: 'asc' } };
  } else if (sort === 'score_desc') {
    orderBy = { result: { score: 'desc' } };
  } else {
    orderBy = { completedAt: 'desc' };
  }

  const [attempts, total] = await Promise.all([
    prisma.quizAttempt.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        quiz: {
          select: {
            id: true,
            title: true
          }
        },
        result: {
          select: {
            score: true,
            total: true,
            passed: true
          }
        }
      },
      orderBy
    }),
    prisma.quizAttempt.count({ where })
  ]);

  // Format results
  const results = attempts.map(attempt => ({
    studentId: attempt.user.id,
    studentName: attempt.user.name,
    studentEmail: attempt.user.email,
    quizId: attempt.quiz.id,
    quizTitle: attempt.quiz.title,
    score: attempt.result?.score || 0,
    total: attempt.result?.total || 0,
    passed: attempt.result?.passed || false,
    completedAt: attempt.completedAt,
    attemptId: attempt.id
  }));

  return { results, total, page, limit, pages: Math.ceil(total / limit) };
};
