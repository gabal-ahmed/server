import prisma from '../prisma.js';

export const getAssignments = async (userId, role, filters = {}) => {
  const { subjectId } = filters;
  
  const where = {
    isDeleted: false,
    ...(subjectId && { subjectId }),
    ...(role === 'TEACHER' ? { teacherId: userId } : {})
  };

  return prisma.assignment.findMany({
    where,
    include: {
      subject: { select: { name: true } },
      teacher: { select: { name: true } },
      _count: { select: { submissions: true } }
    },
    orderBy: { dueDate: 'asc' }
  });
};

export const createAssignment = async (teacherId, data) => {
  return prisma.assignment.create({
    data: {
      ...data,
      dueDate: new Date(data.dueDate),
      teacherId
    }
  });
};

export const submitAssignment = async (studentId, assignmentId, data) => {
  const { fileUrl, content } = data;

  return prisma.assignmentSubmission.create({
    data: {
      assignmentId,
      studentId,
      fileUrl,
      content
    }
  });
};

export const getSubmissionsForAssignment = async (assignmentId) => {
  return prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    include: {
      student: { select: { name: true, email: true } }
    },
    orderBy: { submittedAt: 'desc' }
  });
};

export const gradeSubmission = async (submissionId, data) => {
  const { score, feedback } = data;

  return prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      score,
      feedback,
      status: 'GRADED',
      gradedAt: new Date()
    }
  });
};

export const getStudentSubmissions = async (studentId) => {
  return prisma.assignmentSubmission.findMany({
    where: { studentId },
    include: {
      assignment: {
        select: {
          title: true,
          dueDate: true,
          subject: { select: { name: true } }
        }
      }
    },
    orderBy: { submittedAt: 'desc' }
  });
};
