import prisma from '../prisma.js';

export const getStudentAnalytics = async (studentId) => {
  // 1. Progress: Lessons completed vs total in subscribed teachers' subjects
  const subscriptions = await prisma.subscription.findMany({
    where: { studentId },
    include: {
      teacher: {
        include: {
          createdLessons: {
            where: { isDeleted: false, published: true }
          }
        }
      }
    }
  });

  const allRelevantLessonIds = [];
  subscriptions.forEach(sub => {
    sub.teacher.createdLessons.forEach(l => allRelevantLessonIds.push(l.id));
  });

  const completedLessonsCount = await prisma.studentLessonProgress.count({
    where: {
      userId: studentId,
      lessonId: { in: allRelevantLessonIds },
      completed: true
    }
  });

  // 2. Average Quiz Score
  const results = await prisma.result.findMany({
    where: { userId: studentId },
    select: { score: true, total: true }
  });

  const avgScore = results.length > 0
    ? (results.reduce((acc, r) => acc + (r.score / r.total), 0) / results.length) * 100
    : 0;

  // 3. Quiz Performance over time
  const performanceOverTime = await prisma.result.findMany({
    where: { userId: studentId },
    select: { createdAt: true, score: true, total: true, quiz: { select: { title: true } } },
    orderBy: { createdAt: 'asc' },
    take: 10
  });

  return {
    progress: {
      total: allRelevantLessonIds.length,
      completed: completedLessonsCount,
      percentage: allRelevantLessonIds.length > 0 ? (completedLessonsCount / allRelevantLessonIds.length) * 100 : 0
    },
    avgScore,
    performanceOverTime: performanceOverTime.map(r => ({
      date: r.createdAt.toISOString().split('T')[0],
      score: (r.score / r.total) * 100,
      title: r.quiz.title
    })),
    recentLessons: subscriptions.flatMap(sub =>
      sub.teacher.createdLessons.map(l => ({
        id: l.id,
        title: l.title,
        teacherName: sub.teacher.name,
        createdAt: l.createdAt
      }))
    ).sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
  };
};

export const getTeacherAnalytics = async (teacherId) => {
  // 1. Average scores per quiz
  const quizzes = await prisma.quiz.findMany({
    where: { teacherId, isDeleted: false },
    include: {
      results: {
        select: { score: true, total: true }
      }
    }
  });

  const quizPerformance = quizzes.map(q => {
    const avg = q.results.length > 0
      ? (q.results.reduce((acc, r) => acc + (r.score / r.total), 0) / q.results.length) * 100
      : 0;
    return { title: q.title, avgScore: avg, attemptCount: q.results.length };
  });

  // 3. Recent Activity (Latest results in teacher's quizzes)
  const recentActivity = await prisma.result.findMany({
    where: { quiz: { teacherId } },
    include: {
      user: { select: { name: true, email: true } },
      quiz: { select: { title: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // 2. Pending Submissions
  const pendingSubmissions = await prisma.assignmentSubmission.count({
    where: {
      assignment: { teacherId },
      status: 'SUBMITTED'
    }
  });

  return {
    quizPerformance,
    pendingSubmissions,
    recentActivity: recentActivity.map(a => ({
      studentName: a.user.name,
      quizTitle: a.quiz.title,
      score: (a.score / a.total) * 100,
      date: a.createdAt
    }))
  };
};

export const getAdminAnalytics = async () => {
  const [userStats, lessonCount, quizCount, recentUsers] = await Promise.all([
    prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true }
    }),
    prisma.lesson.count({ where: { isDeleted: false } }),
    prisma.quiz.count({ where: { isDeleted: false } }),
    prisma.user.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true, isActive: true }
    })
  ]);

  const roles = {
    STUDENT: userStats.find(s => s.role === 'STUDENT')?._count._all || 0,
    TEACHER: userStats.find(s => s.role === 'TEACHER')?._count._all || 0,
    ADMIN: userStats.find(s => s.role === 'ADMIN')?._count._all || 0
  };

  return {
    usersByRole: roles,
    totalContent: {
      lessons: lessonCount,
      quizzes: quizCount
    },
    recentUsers
  };
};
