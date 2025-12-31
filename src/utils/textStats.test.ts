import { describe, it, expect } from 'vitest';
import { calculateWordCount, calculateSentenceCount, calculateTextStats } from './textStats';

describe('textStats', () => {
  describe('calculateWordCount', () => {
    it('should return 0 for empty string', () => {
      expect(calculateWordCount('')).toBe(0);
    });

    it('should return 0 for whitespace-only string', () => {
      expect(calculateWordCount('   ')).toBe(0);
      expect(calculateWordCount('\n\t  ')).toBe(0);
    });

    it('should return 1 for single word', () => {
      expect(calculateWordCount('hello')).toBe(1);
    });

    it('should return 1 for single word with surrounding whitespace', () => {
      expect(calculateWordCount('  hello  ')).toBe(1);
    });

    it('should count multiple words correctly', () => {
      expect(calculateWordCount('hello world')).toBe(2);
      expect(calculateWordCount('hello world test')).toBe(3);
    });

    it('should handle multiple spaces between words', () => {
      expect(calculateWordCount('hello    world')).toBe(2);
      expect(calculateWordCount('hello   world   test')).toBe(3);
    });

    it('should handle newlines and tabs', () => {
      expect(calculateWordCount('hello\nworld')).toBe(2);
      expect(calculateWordCount('hello\tworld')).toBe(2);
      expect(calculateWordCount('hello\n\tworld')).toBe(2);
    });

    it('should handle mixed whitespace', () => {
      expect(calculateWordCount('hello   world\n\ttest')).toBe(3);
    });

    it('should handle punctuation within words', () => {
      expect(calculateWordCount("don't can't won't")).toBe(3);
      // Hyphens are treated as word separators
      expect(calculateWordCount('hello-world test-case')).toBe(2);
    });

    it('should handle numbers as words', () => {
      expect(calculateWordCount('123 456 789')).toBe(3);
      expect(calculateWordCount('hello 123 world')).toBe(3);
    });

    it('should handle special characters', () => {
      expect(calculateWordCount('@hello #world $test')).toBe(3);
    });
  });

  describe('calculateSentenceCount', () => {
    it('should return 0 for empty string', () => {
      expect(calculateSentenceCount('')).toBe(0);
    });

    it('should return 0 for whitespace-only string', () => {
      expect(calculateSentenceCount('   ')).toBe(0);
      expect(calculateSentenceCount('\n\t  ')).toBe(0);
    });

    it('should return 1 for text without sentence endings', () => {
      expect(calculateSentenceCount('hello world')).toBe(1);
      expect(calculateSentenceCount('This is a test')).toBe(1);
    });

    it('should count single sentence correctly', () => {
      expect(calculateSentenceCount('Hello world.')).toBe(1);
      expect(calculateSentenceCount('Hello world!')).toBe(1);
      expect(calculateSentenceCount('Hello world?')).toBe(1);
    });

    it('should count multiple sentences correctly', () => {
      expect(calculateSentenceCount('Hello world. How are you?')).toBe(2);
      expect(calculateSentenceCount('First sentence. Second sentence. Third sentence.')).toBe(3);
    });

    it('should handle different sentence endings', () => {
      expect(calculateSentenceCount('First! Second? Third.')).toBe(3);
    });

    it('should handle multiple punctuation marks', () => {
      expect(calculateSentenceCount('Hello!!! How are you???')).toBe(2);
      expect(calculateSentenceCount('Wow... Really?')).toBe(2);
    });

    it('should handle sentences ending at end of string', () => {
      expect(calculateSentenceCount('Hello world.')).toBe(1);
      expect(calculateSentenceCount('Hello world. How are you')).toBe(1);
    });

    it('should handle sentences with whitespace after punctuation', () => {
      expect(calculateSentenceCount('Hello world. How are you?')).toBe(2);
      expect(calculateSentenceCount('First.  Second.')).toBe(2);
    });

    it('should handle sentences with newlines', () => {
      expect(calculateSentenceCount('Hello world.\nHow are you?')).toBe(2);
      expect(calculateSentenceCount('First.\n\nSecond.')).toBe(2);
    });

    it('should handle abbreviations', () => {
      // Abbreviations with periods are counted as sentence endings
      expect(calculateSentenceCount('Dr. Smith went to the U.S.A.')).toBe(2);
      // "Mr." and "." both match the regex, so it counts as 2 sentence endings
      expect(calculateSentenceCount('Mr. Smith said hello.')).toBe(2);
    });

    it('should handle decimal numbers', () => {
      expect(calculateSentenceCount('The price is 3.14 dollars.')).toBe(1);
    });
  });

  describe('calculateTextStats', () => {
    it('should return both word and sentence counts for empty string', () => {
      const stats = calculateTextStats('');
      expect(stats.wordCount).toBe(0);
      expect(stats.sentenceCount).toBe(0);
    });

    it('should return correct counts for simple text', () => {
      const stats = calculateTextStats('Hello world. How are you?');
      expect(stats.wordCount).toBe(5); // "Hello", "world", "How", "are", "you"
      expect(stats.sentenceCount).toBe(2);
    });

    it('should return correct counts for longer text', () => {
      const text = 'This is the first sentence. This is the second sentence! And this is the third?';
      const stats = calculateTextStats(text);
      expect(stats.wordCount).toBe(15);
      expect(stats.sentenceCount).toBe(3);
    });

    it('should handle text without sentence endings', () => {
      const stats = calculateTextStats('Hello world test');
      expect(stats.wordCount).toBe(3);
      expect(stats.sentenceCount).toBe(1);
    });

    it('should handle text with only whitespace', () => {
      const stats = calculateTextStats('   \n\t  ');
      expect(stats.wordCount).toBe(0);
      expect(stats.sentenceCount).toBe(0);
    });

    it('should handle single word', () => {
      const stats = calculateTextStats('hello');
      expect(stats.wordCount).toBe(1);
      expect(stats.sentenceCount).toBe(1);
    });

    it('should handle single sentence', () => {
      const stats = calculateTextStats('This is a single sentence.');
      expect(stats.wordCount).toBe(5);
      expect(stats.sentenceCount).toBe(1);
    });
  });
});

