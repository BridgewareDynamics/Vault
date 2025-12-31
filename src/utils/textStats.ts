/**
 * Utility functions for calculating text statistics
 */

/**
 * Calculates the word count from plain text
 * Words are defined as sequences of non-whitespace characters
 * @param text - The text to analyze
 * @returns The number of words in the text
 */
export function calculateWordCount(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  
  // Split by whitespace and filter out empty strings
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Calculates the sentence count from plain text
 * Sentences are defined as sequences ending with . ! or ? followed by whitespace or end of string
 * @param text - The text to analyze
 * @returns The number of sentences in the text
 */
export function calculateSentenceCount(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  
  // Match sentences ending with . ! or ? followed by whitespace or end of string
  // This regex handles multiple sentence endings and edge cases
  const sentenceEndings = text.match(/[.!?]+(?:\s+|$)/g);
  
  if (!sentenceEndings) {
    // If no sentence endings found, check if there's any content
    // If there's content without sentence endings, count as 1 sentence
    return text.trim().length > 0 ? 1 : 0;
  }
  
  return sentenceEndings.length;
}

/**
 * Calculates both word count and sentence count from plain text
 * @param text - The text to analyze
 * @returns An object containing wordCount and sentenceCount
 */
export function calculateTextStats(text: string): { wordCount: number; sentenceCount: number } {
  return {
    wordCount: calculateWordCount(text),
    sentenceCount: calculateSentenceCount(text),
  };
}





