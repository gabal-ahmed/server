import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['STUDENT', 'TEACHER']).optional() // Allow selecting role or default to STUDENT? usually safer to only allow STUDENT registration publicly. I'll allow both for MVP simplicity or restrict. Let's strict it to STUDENT only for public register, and Admin creates others?
  // Teacher registration often needs verification. I'll allow role field but controller might restrict it.
  // Actually, let's keep it simple: Public registration = Student. Admin/Seed = Teacher/Admin.
  // BUT, for the hackathon/demo, maybe allow both. I'll just validate string for now.
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
