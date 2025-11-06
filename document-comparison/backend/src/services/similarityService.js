const stringSimilarity = require('string-similarity');
const natural = require('natural');

class SimilarityService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Calculate similarity between two texts using multiple methods
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;

    // Normalize texts
    const normalized1 = this.normalizeText(text1);
    const normalized2 = this.normalizeText(text2);

    // Calculate using string similarity (Dice coefficient)
    const diceSimilarity = stringSimilarity.compareTwoStrings(normalized1, normalized2);

    // Calculate using Levenshtein distance
    const levenshteinSimilarity = this.levenshteinSimilarity(normalized1, normalized2);

    // Calculate Jaccard similarity
    const jaccardSimilarity = this.jaccardSimilarity(normalized1, normalized2);

    // Weighted average of different methods
    const avgSimilarity = (diceSimilarity * 0.5 + levenshteinSimilarity * 0.3 + jaccardSimilarity * 0.2);

    return avgSimilarity;
  }

  /**
   * Compare one document with multiple documents
   * @param {string} sourceText - Source document text
   * @param {Array<{text: string, name: string}>} targetTexts - Array of target documents
   * @param {number} threshold - Similarity threshold (0-100)
   * @returns {Array} Comparison results
   */
  compareOneToMany(sourceText, targetTexts, threshold = 90) {
    const sourceLines = this.splitIntoLines(sourceText);
    const results = [];

    targetTexts.forEach(target => {
      const targetLines = this.splitIntoLines(target.text);
      const matches = this.findMatches(sourceLines, targetLines, threshold / 100);

      results.push({
        targetName: target.name,
        totalMatches: matches.length,
        matches: matches,
        overallSimilarity: this.calculateSimilarity(sourceText, target.text) * 100
      });
    });

    return results;
  }

  /**
   * Compare two documents line by line
   * @param {string} text1 - First document text
   * @param {string} text2 - Second document text
   * @param {number} threshold - Similarity threshold (0-100)
   * @returns {Object} Detailed comparison results
   */
  compareOneToOne(text1, text2, threshold = 90) {
    const lines1 = this.splitIntoLines(text1);
    const lines2 = this.splitIntoLines(text2);

    const matches = this.findMatches(lines1, lines2, threshold / 100);
    const overallSimilarity = this.calculateSimilarity(text1, text2) * 100;

    return {
      overallSimilarity,
      totalMatches: matches.length,
      matches,
      sourceLines: lines1.length,
      targetLines: lines2.length
    };
  }

  /**
   * Find matching lines between two sets of lines
   */
  findMatches(sourceLines, targetLines, threshold) {
    const matches = [];

    sourceLines.forEach((sourceLine, sourceIndex) => {
      targetLines.forEach((targetLine, targetIndex) => {
        const similarity = this.calculateSimilarity(sourceLine, targetLine);

        if (similarity >= threshold) {
          matches.push({
            sourceLineIndex: sourceIndex,
            targetLineIndex: targetIndex,
            sourceLine: sourceLine,
            targetLine: targetLine,
            similarity: Math.round(similarity * 100),
            differences: this.highlightDifferences(sourceLine, targetLine)
          });
        }
      });
    });

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Highlight differences between two texts
   */
  highlightDifferences(text1, text2) {
    const words1 = this.tokenizer.tokenize(text1.toLowerCase()) || [];
    const words2 = this.tokenizer.tokenize(text2.toLowerCase()) || [];

    const added = words2.filter(w => !words1.includes(w));
    const removed = words1.filter(w => !words2.includes(w));

    return { added, removed };
  }

  /**
   * Normalize text for comparison
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, '') // Keep Korean characters
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Split text into lines
   */
  splitIntoLines(text) {
    return text
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  /**
   * Calculate Levenshtein similarity
   */
  levenshteinSimilarity(str1, str2) {
    const distance = natural.LevenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    if (maxLength === 0) return 1;
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Jaccard similarity
   */
  jaccardSimilarity(str1, str2) {
    const set1 = new Set(this.tokenizer.tokenize(str1.toLowerCase()) || []);
    const set2 = new Set(this.tokenizer.tokenize(str2.toLowerCase()) || []);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  /**
   * Get detailed statistics about the comparison
   */
  getStatistics(matches, sourceLines, targetLines) {
    const totalSourceLines = sourceLines.length;
    const totalTargetLines = targetLines.length;
    const matchedSourceLines = new Set(matches.map(m => m.sourceLineIndex)).size;
    const matchedTargetLines = new Set(matches.map(m => m.targetLineIndex)).size;

    return {
      totalSourceLines,
      totalTargetLines,
      matchedSourceLines,
      matchedTargetLines,
      sourceMatchPercentage: (matchedSourceLines / totalSourceLines * 100).toFixed(2),
      targetMatchPercentage: (matchedTargetLines / totalTargetLines * 100).toFixed(2),
      totalMatches: matches.length
    };
  }
}

module.exports = new SimilarityService();
