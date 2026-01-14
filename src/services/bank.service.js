import prisma from '../prisma.js';

export const getAllBankQuestions = async (params = {}) => {
  const { page = 1, limit = 20, search = '', subjectId, unitId, difficulty } = params;
  const skip = (page - 1) * limit;

  const where = {
    isDeleted: false,
    ...(subjectId && { subjectId }),
    ...(unitId && { unitId }),
    ...(difficulty && { difficulty }),
    ...(search && {
      text: { contains: search }
    })
  };

  const [questions, total] = await Promise.all([
    prisma.bankQuestion.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        options: true,
        subject: { select: { name: true } },
        unit: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.bankQuestion.count({ where })
  ]);

  return { questions, total, page, limit, pages: Math.ceil(total / limit) };
};

export const createBankQuestion = async (teacherId, data) => {
  const { text, difficulty, subjectId, unitId, options } = data;

  return prisma.bankQuestion.create({
    data: {
      text,
      difficulty,
      subjectId,
      unitId,
      teacherId,
      options: {
        create: options.map(opt => ({
          text: opt.text,
          isCorrect: opt.isCorrect
        }))
      }
    },
    include: { options: true }
  });
};

export const deleteBankQuestion = async (id) => {
  return prisma.bankQuestion.update({
    where: { id },
    data: { isDeleted: true }
  });
};

export const importToQuiz = async (quizId, bankQuestionIds) => {
  const bankQuestions = await prisma.bankQuestion.findMany({
    where: { id: { in: bankQuestionIds } },
    include: { options: true }
  });

  const quizQuestionsData = bankQuestions.map(bq => ({
    quizId,
    text: bq.text,
    type: 'MULTIPLE_CHOICE',
    points: 1,
    options: {
      create: bq.options.map(opt => ({
        text: opt.text,
        isCorrect: opt.isCorrect
      }))
    }
  }));

  // Prisma doesn't support nested creates in crateMany, so we loop or use Promise.all
  return Promise.all(
    quizQuestionsData.map(qData => 
      prisma.question.create({ data: qData })
    )
  );
};
