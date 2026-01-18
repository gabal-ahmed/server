import prisma from '../prisma.js';

export const getMyQuizzes = async (teacherId, params = {}) => {
  const { page = 1, limit = 10, search = '' } = params;
  const skip = (page - 1) * limit;

  const where = {
    teacherId,
    isDeleted: false,
    ...(search ? { title: { contains: search } } : {})
  };

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      skip,
      take: Number(limit),
      include: { questions: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.quiz.count({ where })
  ]);

  return { quizzes, total, page, limit, pages: Math.ceil(total / limit) };
};

export const deleteQuiz = async (id) => {
  return prisma.quiz.update({ where: { id }, data: { isDeleted: true } });
}

export const updateQuiz = async (id, data) => {
  // If trying to unpublish (set published to false), check for existing attempts
  if (data.published === false) {
    const existingAttempts = await prisma.quizAttempt.count({
      where: { quizId: id }
    });

    if (existingAttempts > 0) {
      throw new Error('Cannot unpublish quiz: Students have already attempted this quiz');
    }
  }

  return prisma.quiz.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.published !== undefined && { published: data.published })
    }
  });
}


export const createQuiz = async (data) => {
  const { title, description, teacherId, lessonId, questions } = data;
  return prisma.quiz.create({
    data: {
      title,
      description,
      teacherId,
      lessonId,
      published: data.published || false,
      questions: {
        create: questions?.map(q => ({
          text: q.text,
          type: q.type,
          points: q.points,
          options: {
            create: q.options
          }
        }))
      }
    },
    include: {
      questions: { include: { options: true } }
    }
  });
};

export const addQuestion = async (quizId, data) => {
  const { text, type, points, options } = data;
  // options: [{ text: "A", isCorrect: true }, ...]

  return prisma.question.create({
    data: {
      quizId,
      text,
      type,
      points,
      options: {
        create: options
      }
    },
    include: { options: true }
  });
};

export const getQuiz = async (id) => {
  return prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        include: { options: { select: { id: true, text: true } } } // Don't reveal isCorrect to student here? 
        // Ideally we filter isCorrect out in controller or check role.
      }
    }
  });
};

// Teacher view of quiz (includes isCorrect)
export const getQuizForTeacher = async (id) => {
  return prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        include: { options: true }
      }
    }
  });
};

export const startAttempt = async (userId, quizId) => {
  const existingUnknown = await prisma.quizAttempt.findFirst({
    where: { userId, quizId }
  });

  // If there is an existing attempt, we should return it or error?
  // User wants "cannot take it again". So if it exists (even if incomplete?), let's return it or error.
  // Ideally if incomplete, resume. If complete, error.

  if (existingUnknown) {
    if (existingUnknown.completedAt) {
      throw new Error('Quiz already completed');
    }
    return existingUnknown; // Resume existing attempt
  }

  return prisma.quizAttempt.create({
    data: {
      userId,
      quizId
    }
  });
};

export const submitAttempt = async (attemptId, answers) => {
  // answers: [{ questionId, selectedOptionId }]

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { quiz: { include: { questions: { include: { options: true } } } } }
  });

  if (!attempt) throw new Error('Attempt not found');
  if (attempt.completedAt) throw new Error('Attempt already submitted');

  let totalScore = 0;
  let earnedScore = 0;

  const questionsMap = new Map();
  attempt.quiz.questions.forEach(q => {
    questionsMap.set(q.id, q);
    totalScore += q.points;
  });

  // Save answers
  for (const ans of answers) {
    await prisma.quizAnswer.create({
      data: {
        attemptId,
        questionId: ans.questionId,
        selectedOptionId: ans.selectedOptionId
      }
    });

    const question = questionsMap.get(ans.questionId);
    if (question && ans.selectedOptionId) {
      const selectedOption = question.options.find(o => o.id === ans.selectedOptionId);
      if (selectedOption && selectedOption.isCorrect) {
        earnedScore += question.points;
      }
    }
  }

  const passed = (earnedScore / totalScore) >= 0.5; // 50% pass rate hardcoded for now

  // Update Attempt
  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { completedAt: new Date() }
  });

  // Create Result
  const result = await prisma.result.create({
    data: {
      score: earnedScore,
      total: totalScore,
      userId: attempt.userId,
      quizId: attempt.quizId,
      attemptId: attempt.id,
      passed,
      percentage: (earnedScore / totalScore) * 100
    }
  });

  return result;
};

export const getResults = async (userId) => {
  return prisma.result.findMany({
    where: { userId },
    include: { quiz: true }
  });
};

export const getAttemptReview = async (userId, attemptId) => {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: {
            include: {
              options: true
            }
          }
        }
      },
      answers: true,
      result: true
    }
  });

  if (!attempt) throw new Error('Attempt not found');
  // Allow if user is owner OR teacher/admin (simplified for now to just owner check, or let controller handle higher roles)
  if (attempt.userId !== userId) throw new Error('Unauthorized');

  return attempt;
};

export const getQuizResults = async (quizId) => {
  return prisma.quizAttempt.findMany({
    where: { quizId, completedAt: { not: null } },
    include: {
      user: {
        select: { name: true, email: true }
      },
      result: true
    },
    orderBy: { completedAt: 'desc' }
  });
};
