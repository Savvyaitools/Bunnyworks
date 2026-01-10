/**
 * Shared Zod validation schemas for forms
 */
import { z } from "zod";

// ============= Creator Schemas =============
export const creatorFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  platform: z
    .string()
    .trim()
    .max(50, "Platform must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  followers: z
    .string()
    .trim()
    .max(20, "Followers must be less than 20 characters")
    .optional()
    .or(z.literal("")),
});

export type CreatorFormValues = z.infer<typeof creatorFormSchema>;

// ============= Employee Schemas =============
export const employeeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  phone: z
    .string()
    .trim()
    .max(30, "Phone must be less than 30 characters")
    .optional()
    .or(z.literal("")),
  role: z
    .string()
    .min(1, "Role is required"),
  department: z
    .string()
    .optional()
    .or(z.literal("")),
  salary: z
    .number()
    .min(0, "Salary cannot be negative")
    .max(1000000, "Salary seems too high")
    .optional()
    .or(z.literal(0)),
  commission_rate: z
    .number()
    .min(0, "Commission rate cannot be negative")
    .max(100, "Commission rate cannot exceed 100%")
    .optional()
    .or(z.literal(0)),
  bio: z
    .string()
    .trim()
    .max(500, "Bio must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  experience: z
    .string()
    .trim()
    .max(200, "Experience must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  education: z
    .string()
    .trim()
    .max(200, "Education must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  skills: z
    .string()
    .trim()
    .max(500, "Skills must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  certifications: z
    .string()
    .trim()
    .max(500, "Certifications must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  emergency_contact: z
    .string()
    .trim()
    .max(100, "Emergency contact must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(200, "Address must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  // Chatter-specific fields
  skill_grade: z
    .enum(["A", "B", "C"])
    .optional(),
  timezone: z
    .string()
    .trim()
    .max(100, "Timezone must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  daily_target_messages: z
    .number()
    .min(0, "Target cannot be negative")
    .max(10000, "Target seems too high")
    .optional()
    .or(z.literal(100)),
  daily_target_ppv: z
    .number()
    .min(0, "Target cannot be negative")
    .max(1000, "Target seems too high")
    .optional()
    .or(z.literal(20)),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

// Reusable account schema for both employees and creators
export const accountPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters"),
});

export type AccountPasswordValues = z.infer<typeof accountPasswordSchema>;

// Legacy export for backward compatibility
export const employeeAccountSchema = accountPasswordSchema;
export type EmployeeAccountValues = AccountPasswordValues;

// ============= Task Schemas =============
export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  request_type: z.enum(["general", "custom"]),
  due_date: z.string().optional().or(z.literal("")),
  assignee_id: z.string().optional().or(z.literal("none")),
  creator_id: z.string().optional().or(z.literal("none")),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
