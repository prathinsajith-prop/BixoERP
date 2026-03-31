import { z } from 'zod';

export const UpdateProfileDto = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  personal: z
    .object({
      phone: z.string().max(30).optional(),
      dateOfBirth: z.string().max(10).optional(),
      gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say', '']).optional(),
      bio: z.string().max(500).optional(),
      avatarUrl: z.string().max(2048).optional(),
    })
    .optional(),
  work: z
    .object({
      employeeId: z.string().max(50).optional(),
      department: z.string().max(100).optional(),
      jobTitle: z.string().max(100).optional(),
      manager: z.string().max(200).optional(),
      workLocation: z.enum(['office', 'remote', 'hybrid', '']).optional(),
      joinDate: z.string().max(10).optional(),
      skills: z.array(z.string().max(50)).max(20).optional(),
    })
    .optional(),
  address: z
    .object({
      street: z.string().max(200).optional(),
      city: z.string().max(100).optional(),
      state: z.string().max(100).optional(),
      zipCode: z.string().max(20).optional(),
      country: z.string().max(100).optional(),
    })
    .optional(),
  social: z
    .object({
      linkedin: z.string().max(200).optional(),
      github: z.string().max(200).optional(),
      twitter: z.string().max(200).optional(),
      website: z.string().max(200).optional(),
      slack: z.string().max(200).optional(),
    })
    .optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileDto>;
