import { z } from 'zod';

// Constants for validation limits
const MAX_STRING_LENGTH = 1000;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254; // RFC 5321 limit
const MAX_PHONE_LENGTH = 20;
const MAX_NOTES_LENGTH = 2000;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// Reusable validation patterns
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const nameRegex = /^[a-zA-Z\s\-'\.]{2,}$/; // Letters, spaces, hyphens, apostrophes, dots only

// Sanitization helpers
const sanitizeString = (str: string) => str.trim().replace(/\s+/g, ' ');
const sanitizeName = (name: string) => sanitizeString(name).replace(/[^\w\s\-'\.]/g, '');

// Enhanced login validation schema
export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .max(MAX_EMAIL_LENGTH, 'Email is too long')
    .transform(sanitizeString)
    .pipe(z.string().email('Please enter a valid email address'))
    .pipe(z.string().toLowerCase()),
  password: z.string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`)
    .max(MAX_PASSWORD_LENGTH, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Enhanced meeting validation schema
export const meetingSchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const meetingDate = new Date(date + 'T00:00:00');
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return !isNaN(meetingDate.getTime()) && meetingDate <= today;
    }, 'Meeting date must be valid and cannot be in the future'),
  timeOpened: z.string()
    .regex(timeRegex, 'Please enter a valid time in HH:MM format'),
  timeClosed: z.string()
    .regex(timeRegex, 'Please enter a valid time in HH:MM format'),
  offering: z.number()
    .min(0, 'Offering must be a positive number')
    .max(1000000, 'Offering amount is too large')
    .multipleOf(0.01, 'Offering must be a valid currency amount'),
  attendees: z.array(
    z.string()
      .min(1, 'Attendee name cannot be empty')
      .max(MAX_NAME_LENGTH, 'Attendee name is too long')
      .transform(sanitizeName)
  ).min(1, 'At least one attendee is required')
   .max(200, 'Too many attendees listed'),
  visitsCount: z.number()
    .int('Visits count must be a whole number')
    .min(0, 'Visits count must be a positive number')
    .max(1000, 'Visits count is unrealistic'),
  visitNotes: z.string()
    .max(MAX_NOTES_LENGTH, 'Visit notes are too long')
    .transform(sanitizeString)
    .optional(),
}).refine((data) => {
  const [openHour, openMin] = data.timeOpened.split(':').map(Number);
  const [closeHour, closeMin] = data.timeClosed.split(':').map(Number);
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  return closeMinutes > openMinutes;
}, {
  message: 'Closing time must be after opening time',
  path: ['timeClosed'],
});

export type MeetingFormData = z.infer<typeof meetingSchema>;

// Enhanced visitor validation schema
export const visitorSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters long')
    .max(MAX_NAME_LENGTH, 'Name is too long')
    .regex(nameRegex, 'Name contains invalid characters')
    .transform(sanitizeName),
  contact: z.string()
    .min(1, 'Contact information is required')
    .max(MAX_EMAIL_LENGTH, 'Contact information is too long')
    .transform(sanitizeString)
    .refine((contact) => {
      const cleanContact = contact.replace(/[\s\-\(\)]/g, '');
      return emailRegex.test(contact) || phoneRegex.test(cleanContact);
    }, 'Please enter a valid phone number or email address'),
  notes: z.string()
    .max(MAX_NOTES_LENGTH, 'Notes are too long')
    .transform(sanitizeString)
    .optional()
    .default(''),
  isConvert: z.boolean().default(false),
  followUpRequired: z.boolean().default(false),
});

export type VisitorFormData = z.infer<typeof visitorSchema>;

// Enhanced cell member validation schema
export const cellMemberSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters long')
    .max(MAX_NAME_LENGTH, 'Name is too long')
    .regex(nameRegex, 'Name contains invalid characters')
    .transform(sanitizeName),
  phone: z.string()
    .min(1, 'Phone number is required')
    .max(MAX_PHONE_LENGTH, 'Phone number is too long')
    .transform((phone) => phone.replace(/[\s\-\(\)]/g, ''))
    .pipe(z.string().regex(phoneRegex, 'Please enter a valid phone number')),
  email: z.union([
    z.string().length(0),
    z.string()
      .max(MAX_EMAIL_LENGTH, 'Email is too long')
      .transform(sanitizeString)
      .pipe(z.string().email('Please enter a valid email address'))
      .pipe(z.string().toLowerCase())
  ]).default(''),
});

export type CellMemberFormData = z.infer<typeof cellMemberSchema>;

// Enhanced area validation schema
export const areaSchema = z.object({
  name: z.string()
    .min(2, 'Area name must be at least 2 characters long')
    .max(MAX_NAME_LENGTH, 'Area name is too long')
    .transform(sanitizeString),
  districtName: z.string()
    .max(MAX_NAME_LENGTH, 'District name is too long')
    .transform(sanitizeString)
    .optional(),
  areaLeaderName: z.string()
    .max(MAX_NAME_LENGTH, 'Area leader name is too long')
    .transform(sanitizeString)
    .optional(),
  districtLeaderName: z.string()
    .max(MAX_NAME_LENGTH, 'District leader name is too long')
    .transform(sanitizeString)
    .optional(),
  districtPastorName: z.string()
    .max(MAX_NAME_LENGTH, 'District pastor name is too long')
    .transform(sanitizeString)
    .optional(),
});

export type AreaFormData = z.infer<typeof areaSchema>;

// Enhanced cell validation schema
export const cellSchema = z.object({
  name: z.string()
    .min(2, 'Cell name must be at least 2 characters long')
    .max(MAX_NAME_LENGTH, 'Cell name is too long')
    .transform(sanitizeString),
  meetingDay: z.enum(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  meetingTime: z.string()
    .regex(timeRegex, 'Please enter a valid time in HH:MM format')
    .optional(),
  description: z.string()
    .max(MAX_NOTES_LENGTH, 'Description is too long')
    .transform(sanitizeString)
    .optional(),
  areaName: z.string()
    .max(MAX_NAME_LENGTH, 'Area name is too long')
    .transform(sanitizeString)
    .optional(),
  districtName: z.string()
    .max(MAX_NAME_LENGTH, 'District name is too long')
    .transform(sanitizeString)
    .optional(),
});

export type CellFormData = z.infer<typeof cellSchema>;

// Additional security utilities
export const createRateLimitedSchema = <T extends z.ZodTypeAny>(schema: T, maxAttempts = 5) => {
  const attempts = new Map<string, { count: number; lastAttempt: number }>();
  
  return schema.superRefine((data, ctx) => {
    const key = JSON.stringify(data);
    const now = Date.now();
    const userAttempts = attempts.get(key) || { count: 0, lastAttempt: 0 };
    
    // Reset counter if more than 15 minutes have passed
    if (now - userAttempts.lastAttempt > 15 * 60 * 1000) {
      userAttempts.count = 0;
    }
    
    if (userAttempts.count >= maxAttempts) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Too many attempts. Please try again later.',
      });
      return;
    }
    
    userAttempts.count++;
    userAttempts.lastAttempt = now;
    attempts.set(key, userAttempts);
  });
};
