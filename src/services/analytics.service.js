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
    }))
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

  // 2. Pending Submissions
  const pendingSubmissions = await prisma.assignmentSubmission.count({
    where: {
      assignment: { teacherId },
      status: 'SUBMITTED'
    }
  });

  return {
    quizPerformance,
    pendingSubmissions
  };
};
