import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  meetingSchema,
  visitorSchema,
  cellMemberSchema,
  areaSchema,
  cellSchema,
} from '../validations';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid email');
      }
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 6 characters');
      }
    });

    it('should reject empty fields', () => {
      const invalidData = {
        email: '',
        password: '',
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);
      }
    });
  });

  describe('meetingSchema', () => {
    it('should validate correct meeting data', () => {
      const validData = {
        date: '2024-01-15',
        timeOpened: '18:00',
        timeClosed: '19:30',
        offering: 100.50,
        attendees: ['member1', 'member2'],
        visitsCount: 3,
        visitNotes: 'Visited three families',
      };
      
      const result = meetingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject future meeting date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const invalidData = {
        date: futureDate.toISOString().split('T')[0],
        timeOpened: '18:00',
        timeClosed: '19:30',
        offering: 100,
        attendees: ['member1'],
        visitsCount: 0,
      };
      
      const result = meetingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be in the future');
      }
    });

    it('should reject invalid time format', () => {
      const invalidData = {
        date: '2024-01-15',
        timeOpened: '25:00', // Invalid hour
        timeClosed: '19:30',
        offering: 100,
        attendees: ['member1'],
        visitsCount: 0,
      };
      
      const result = meetingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid time');
      }
    });

    it('should reject closing time before opening time', () => {
      const invalidData = {
        date: '2024-01-15',
        timeOpened: '19:30',
        timeClosed: '18:00', // Before opening time
        offering: 100,
        attendees: ['member1'],
        visitsCount: 0,
      };
      
      const result = meetingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('after opening time');
      }
    });

    it('should reject negative offering', () => {
      const invalidData = {
        date: '2024-01-15',
        timeOpened: '18:00',
        timeClosed: '19:30',
        offering: -50,
        attendees: ['member1'],
        visitsCount: 0,
      };
      
      const result = meetingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject empty attendees array', () => {
      const invalidData = {
        date: '2024-01-15',
        timeOpened: '18:00',
        timeClosed: '19:30',
        offering: 100,
        attendees: [],
        visitsCount: 0,
      };
      
      const result = meetingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one attendee');
      }
    });
  });

  describe('visitorSchema', () => {
    it('should validate correct visitor data', () => {
      const validData = {
        name: 'John Doe',
        contact: '+1234567890',
        notes: 'First time visitor',
        isConvert: false,
        followUpRequired: true,
      };
      
      const result = visitorSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate email contact', () => {
      const validData = {
        name: 'Jane Smith',
        contact: 'jane@example.com',
        notes: '',
        isConvert: true,
        followUpRequired: false,
      };
      
      const result = visitorSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const invalidData = {
        name: 'J',
        contact: '+1234567890',
        notes: '',
        isConvert: false,
        followUpRequired: false,
      };
      
      const result = visitorSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should reject invalid contact format', () => {
      const invalidData = {
        name: 'John Doe',
        contact: 'invalid-contact',
        notes: '',
        isConvert: false,
        followUpRequired: false,
      };
      
      const result = visitorSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid phone number or email');
      }
    });
  });

  describe('cellMemberSchema', () => {
    it('should validate correct member data', () => {
      const validData = {
        name: 'Mary Johnson',
        phone: '+1234567890',
        email: 'mary@example.com',
      };
      
      const result = cellMemberSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow empty email', () => {
      const validData = {
        name: 'John Smith',
        phone: '+1234567890',
        email: '',
      };
      
      const result = cellMemberSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone number', () => {
      const invalidData = {
        name: 'John Smith',
        phone: 'invalid-phone',
        email: '',
      };
      
      const result = cellMemberSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid phone number');
      }
    });
  });

  describe('areaSchema', () => {
    it('should validate correct area data', () => {
      const validData = {
        name: 'Area Alpha',
        districtName: 'District A',
        areaLeaderName: 'Pastor John',
        districtLeaderName: 'Elder Mary',
        districtPastorName: 'Pastor Paul',
      };
      
      const result = areaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal area data', () => {
      const validData = {
        name: 'Area Beta',
      };
      
      const result = areaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short area name', () => {
      const invalidData = {
        name: 'A',
      };
      
      const result = areaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });
  });

  describe('cellSchema', () => {
    it('should validate correct cell data', () => {
      const validData = {
        name: 'Victory Cell 1',
        meetingDay: 'Friday',
        meetingTime: '18:00',
        description: 'Weekly cell meeting',
        areaName: 'Area One',
        districtName: 'District A',
      };
      
      const result = cellSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal cell data', () => {
      const validData = {
        name: 'Faith Cell',
        meetingDay: 'Sunday',
      };
      
      const result = cellSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid meeting time', () => {
      const invalidData = {
        name: 'Hope Cell',
        meetingDay: 'Wednesday',
        meetingTime: '25:00', // Invalid time
      };
      
      const result = cellSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid time');
      }
    });
  });
});
