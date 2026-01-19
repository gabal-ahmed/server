import prisma from '../prisma.js';
import { createNotification } from './notification.service.js';
import { getApprovedStudentIds } from './subscription.service.js';

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
      submissions: role === 'STUDENT' ? {
        where: { studentId: userId },
        select: { id: true, status: true, score: true, feedback: true, fileUrl: true }
      } : false,
      _count: { select: { submissions: true } }
    },
    orderBy: { dueDate: 'asc' }
  });
};

export const createAssignment = async (teacherId, data) => {
  const assignment = await prisma.assignment.create({
    data: {
      ...data,
      dueDate: new Date(data.dueDate),
      teacherId
    },
    include: { teacher: { select: { name: true } } }
  });

  // Notify students
  const studentIds = await getApprovedStudentIds(teacherId);
  await Promise.all(studentIds.map(sid =>
    createNotification(sid, {
      title: 'New Assignment',
      message: `${assignment.teacher.name} posted a new assignment: ${assignment.title}`,
      type: 'CONTENT',
      link: '/student/homework'
    })
  ));

  return assignment;
};

export const submitAssignment = async (studentId, assignmentId, data) => {
  const { fileUrl, content } = data;

  const [submission, student, assignment] = await Promise.all([
    prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        fileUrl,
        content
      }
    }),
    prisma.user.findUnique({ where: { id: studentId } }),
    prisma.assignment.findUnique({ where: { id: assignmentId } })
  ]);

  // Notify Teacher
  await createNotification(assignment.teacherId, {
    title: 'New Assignment Submission',
    message: `${student.name} submitted ${assignment.title}`,
    type: 'CONTENT',
    link: `/teacher/homework/${assignmentId}`
  });

  return submission;
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

  const submission = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      score,
      feedback,
      status: 'GRADED',
      gradedAt: new Date()
    },
    include: {
      assignment: {
        include: { teacher: { select: { name: true } } }
      }
    }
  });

  // Notify Student
  await createNotification(submission.studentId, {
    title: 'Assignment Graded',
    message: `Your assignment "${submission.assignment.title}" has been graded by ${submission.assignment.teacher.name}`,
    type: 'GRADE',
    link: '/student/homework'
  });

  return submission;
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
