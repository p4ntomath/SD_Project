import { describe, it, expect } from 'vitest';
import { formatDate, formatFirebaseDate } from '../../utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('handles null or undefined input', () => {
      expect(formatDate(null)).toBe('Not specified');
      expect(formatDate(undefined)).toBe('Not specified');
    });

    it('formats Firebase timestamp correctly', () => {
      const firebaseTimestamp = { seconds: 1683936000 }; // May 13, 2023
      expect(formatDate(firebaseTimestamp)).toBe('May 13, 2023');
    });

    it('formats Date object correctly', () => {
      const date = new Date('2023-05-13');
      expect(formatDate(date)).toBe('May 13, 2023');
    });

    it('formats date string correctly', () => {
      expect(formatDate('2023-05-13')).toBe('May 13, 2023');
    });

    it('handles invalid date input', () => {
      expect(formatDate('invalid-date')).toBe('Not specified');
    });
  });

  describe('formatFirebaseDate', () => {
    it('handles null or undefined input', () => {
      expect(formatFirebaseDate(null)).toBe('');
      expect(formatFirebaseDate(undefined)).toBe('');
    });

    it('formats Firebase timestamp correctly', () => {
      const firebaseTimestamp = { seconds: 1683936000 }; // May 13, 2023
      expect(formatFirebaseDate(firebaseTimestamp)).toBe('May 13, 2023');
    });

    it('formats Date object correctly', () => {
      const date = new Date('2023-05-13');
      expect(formatFirebaseDate(date)).toBe('May 13, 2023');
    });

    it('formats date string correctly', () => {
      expect(formatFirebaseDate('2023-05-13')).toBe('May 13, 2023');
    });

    it('handles invalid date input', () => {
      expect(formatFirebaseDate('invalid-date')).toBe('');
    });
  });
});