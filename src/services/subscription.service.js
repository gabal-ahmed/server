import prisma from '../prisma.js';
import { createNotification } from './notification.service.js';



export const subscribe = async (studentId, teacherId) => {
  const [subscription, student] = await Promise.all([
    prisma.subscription.create({
      data: {
        studentId,
        teacherId,
        status: 'PENDING'
      }
    }),
    prisma.user.findUnique({ where: { id: studentId } })
  ]);

  // Notify Teacher
  await createNotification(teacherId, {
    title: 'New Subscription Request',
    message: `${student.name} wants to join your classes.`,
    type: 'SUBSCRIPTION',
    link: '/teacher/students'
  });

  return subscription;
};

export const approveSubscription = async (studentId, teacherId) => {
  const [subscription, teacher] = await Promise.all([
    prisma.subscription.update({
      where: {
        studentId_teacherId: {
          studentId,
          teacherId
        }
      },
      data: { status: 'APPROVED' }
    }),
    prisma.user.findUnique({ where: { id: teacherId } })
  ]);

  // Notify Student
  await createNotification(studentId, {
    title: 'Subscription Approved',
    message: `Teacher ${teacher.name} has approved your subscription.`,
    type: 'SUBSCRIPTION',
    link: '/student/teachers'
  });

  return subscription;
};

export const rejectSubscription = async (studentId, teacherId) => {
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });

  // Notify Student before deleting
  await createNotification(studentId, {
    title: 'Subscription Rejected',
    message: `Teacher ${teacher.name} has declined your subscription request.`,
    type: 'SUBSCRIPTION'
  });

  return prisma.subscription.delete({
    where: {
      studentId_teacherId: {
        studentId,
        teacherId
      }
    }
  });
};

export const getPendingRequests = async (teacherId) => {
  return prisma.subscription.findMany({
    where: {
      teacherId,
      status: 'PENDING'
    },
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
  }).then(requests => requests.map(req => ({
    ...req,
    student: {
      id: req.student.id,
      user: {
        name: req.student.name,
        email: req.student.email
      }
    }
  })));
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
          _count: {
            select: {
              createdLessons: { where: { published: true, isDeleted: false } },
              createdQuizzes: { where: { published: true, isDeleted: false } }
            }
          }
        }
      }
    }
  });
};

export const getAllTeachers = async (studentId) => {
  // Get all teachers and check if subscribed
  const teachers = await prisma.user.findMany({
    where: { role: 'TEACHER', isDeleted: false },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: {
          createdLessons: { where: { published: true, isDeleted: false } },
          createdQuizzes: { where: { published: true, isDeleted: false } }
        }
      }
    }
  });

  const mySubscriptions = await prisma.subscription.findMany({
    where: { studentId },
    select: { teacherId: true, status: true }
  });

  const subSet = new Set(mySubscriptions.filter(s => s.status === 'APPROVED').map(s => s.teacherId));
  const pendingSet = new Set(mySubscriptions.filter(s => s.status === 'PENDING').map(s => s.teacherId));

  return teachers.map(t => ({
    ...t,
    isSubscribed: subSet.has(t.id),
    isPending: pendingSet.has(t.id),
    // Map Prisma property names to what the frontend expects if needed, 
    // but the frontend is already using _count.createdLessons/createdQuizzes
    _count: {
      lessons: t._count.createdLessons,
      quizzes: t._count.createdQuizzes
    }
  }));
};

export const getSubscribedLessons = async (studentId) => {
  // Find all teachers I follow
  const subscriptions = await prisma.subscription.findMany({
    where: { studentId, status: 'APPROVED' },
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
    where: { studentId, status: 'APPROVED' },
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
  const { page = 1, limit = 10, search = '', sort = 'latest' } = params;
  const skip = (page - 1) * limit;

  const where = {
    teacherId,
    status: 'APPROVED',
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
            createdAt: true,
            _count: {
              select: {
                quizAttempts: { where: { quiz: { teacherId } } },
                submissions: { where: { assignment: { teacherId } } }
              }
            }
          }
        }
      },
      orderBy:
        sort === 'name_asc' ? { student: { name: 'asc' } } :
          sort === 'name_desc' ? { student: { name: 'desc' } } :
            sort === 'oldest' ? { createdAt: 'asc' } :
              { createdAt: 'desc' } // latest

    }),
    prisma.subscription.count({ where })
  ]);

  const students = subscriptions.map(sub => ({
    id: sub.student.id,
    createdAt: sub.student.createdAt,
    user: {
      name: sub.student.name,
      email: sub.student.email
    },
    _count: {
      quizAttempts: sub.student._count.quizAttempts,
      homeworkSubmissions: sub.student._count.submissions
    }
  }));
  return { students, total, page, limit, pages: Math.ceil(total / limit) };
};

export const getMyStudentsResultsGrouped = async (teacherId) => {
  // Get all quizzes by this teacher that have attempts from students
  const quizzes = await prisma.quiz.findMany({
    where: { teacherId, isDeleted: false },
    include: {
      questions: { select: { id: true } },
      attempts: {
        where: { completedAt: { not: null } },
        include: {
          user: { select: { id: true, name: true } },
          result: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Format to match frontend: { id, title, questions: [], attempts: [ { id, student: { user: { name } }, score, createdAt } ] }
  return quizzes.map(quiz => ({
    id: quiz.id,
    title: quiz.title,
    questions: quiz.questions,
    attempts: quiz.attempts.map(attempt => ({
      id: attempt.id,
      score: attempt.result?.score || 0,
      createdAt: attempt.completedAt,
      student: {
        user: {
          name: attempt.user.name
        }
      }
    }))
  }));
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
    orderBy = [
      { result: { percentage: 'asc' } },
      { completedAt: 'desc' }
    ];
  } else if (sort === 'score_desc') {
    orderBy = [
      { result: { percentage: 'desc' } },
      { completedAt: 'desc' }
    ];
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
            passed: true,
            percentage: true
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
    percentage: attempt.result?.percentage || 0,
    passed: attempt.result?.passed || false,
    completedAt: attempt.completedAt,
    attemptId: attempt.id
  }));

  return { results, total, page, limit, pages: Math.ceil(total / limit) };
};

export const getTeacherProfile = async (studentId, teacherId) => {
  const teacher = await prisma.user.findFirst({
    where: { id: teacherId, role: 'TEACHER', isDeleted: false },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      createdLessons: {
        where: { published: true, isDeleted: false },
        select: { id: true, title: true, createdAt: true, videoUrl: true }
      },
      createdQuizzes: {
        where: { published: true, isDeleted: false },
        select: { id: true, title: true, createdAt: true, _count: { select: { questions: true } } }
      }
    }
  });

  if (!teacher) throw new Error('Teacher not found');

  const subscription = await prisma.subscription.findUnique({
    where: { studentId_teacherId: { studentId, teacherId } }
  });

  return {
    ...teacher,
    isSubscribed: subscription?.status === 'APPROVED',
    isPending: subscription?.status === 'PENDING'
  };
};

export const getApprovedStudentIds = async (teacherId) => {
  const subscriptions = await prisma.subscription.findMany({
    where: { teacherId, status: 'APPROVED' },
    select: { studentId: true }
  });
  return subscriptions.map(s => s.studentId);
};
