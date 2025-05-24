import { describe, it, expect } from 'vitest';
import { getTagsByFaculty, getFaculties, getAllTags } from '../../utils/tagSuggestions';

describe('tagSuggestions', () => {
  describe('getTagsByFaculty', () => {
    it('returns correct tags for Computer Science faculty', () => {
      const computerScienceTags = getTagsByFaculty('Computer Science');
      expect(computerScienceTags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            faculty: 'Computer Science',
            value: 'artificial-intelligence',
            label: 'Artificial Intelligence'
          })
        ])
      );
      expect(computerScienceTags.every(tag => tag.faculty === 'Computer Science')).toBe(true);
    });

    it('returns correct tags for Engineering faculty', () => {
      const engineeringTags = getTagsByFaculty('Engineering');
      expect(engineeringTags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            faculty: 'Engineering',
            value: 'mechanical-engineering',
            label: 'Mechanical Engineering'
          })
        ])
      );
      expect(engineeringTags.every(tag => tag.faculty === 'Engineering')).toBe(true);
    });

    it('returns empty array for non-existent faculty', () => {
      const tags = getTagsByFaculty('Non Existent Faculty');
      expect(tags).toEqual([]);
    });
  });

  describe('getFaculties', () => {
    it('returns all unique faculties', () => {
      const faculties = getFaculties();
      expect(faculties).toEqual(
        expect.arrayContaining([
          'Computer Science',
          'Engineering',
          'Life Sciences',
          'Physical Sciences',
          'Mathematics',
          'Social Sciences',
          'Business',
          'Environmental Sciences',
          'Arts & Humanities'
        ])
      );
      // Check for uniqueness
      expect(new Set(faculties).size).toBe(faculties.length);
    });
  });

  describe('getAllTags', () => {
    it('returns all available tags', () => {
      const tags = getAllTags();
      expect(tags.length).toBeGreaterThan(0);
      expect(tags[0]).toEqual(
        expect.objectContaining({
          value: expect.any(String),
          label: expect.any(String),
          faculty: expect.any(String)
        })
      );
    });

    it('validates tag structure', () => {
      const tags = getAllTags();
      tags.forEach(tag => {
        expect(tag).toHaveProperty('value');
        expect(tag).toHaveProperty('label');
        expect(tag).toHaveProperty('faculty');
        expect(typeof tag.value).toBe('string');
        expect(typeof tag.label).toBe('string');
        expect(typeof tag.faculty).toBe('string');
      });
    });
  });
});