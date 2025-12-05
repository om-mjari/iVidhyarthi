const natural = require("natural");
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

/**
 * Course Recommendation Engine
 * Uses TF-IDF, cosine similarity, and category matching
 */

class RecommendationEngine {
  constructor() {
    this.tfidf = new TfIdf();
  }

  /**
   * Preprocess text: lowercase, tokenize, remove stopwords
   */
  preprocessText(text) {
    if (!text) return "";
    const stopwords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "should",
      "could",
      "may",
      "might",
      "must",
      "can",
      "this",
      "that",
      "these",
      "those",
    ]);

    const tokens = tokenizer.tokenize(text.toLowerCase());
    return tokens
      .filter((token) => !stopwords.has(token) && token.length > 2)
      .join(" ");
  }

  /**
   * Extract features from a course
   */
  extractFeatures(course) {
    const title = course.Title || course.name || "";
    const description = course.Description || course.description || "";
    const category = course.Category || course.category || "";
    const tags = course.Tags || course.tags || "";
    const instructor = course.Instructor_Name || course.instructor || "";

    // Combine all text features with weights
    const titleText = this.preprocessText(title);
    const descText = this.preprocessText(description);
    const categoryText = this.preprocessText(category);
    const tagsText = this.preprocessText(tags);

    // Weight: title (3x), category (2x), tags (2x), description (1x)
    const combinedText = `${titleText} ${titleText} ${titleText} ${categoryText} ${categoryText} ${tagsText} ${tagsText} ${descText}`;

    return {
      combinedText,
      title,
      description,
      category,
      tags,
      instructor,
      price: course.Price || course.price || 0,
      level: course.Level || course.level || "Beginner",
    };
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let key in vecA) {
      if (vecB[key]) {
        dotProduct += vecA[key] * vecB[key];
      }
      normA += vecA[key] * vecA[key];
    }

    for (let key in vecB) {
      normB += vecB[key] * vecB[key];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate Jaccard similarity for sets
   */
  jaccardSimilarity(setA, setB) {
    if (setA.size === 0 && setB.size === 0) return 0;

    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
  }

  /**
   * Generate recommendations for a purchased course
   */
  generateRecommendations(purchasedCourse, allCourses, topN = 10) {
    // Extract features from purchased course
    const purchasedFeatures = this.extractFeatures(purchasedCourse);

    // Build TF-IDF vectors
    this.tfidf = new TfIdf();
    this.tfidf.addDocument(purchasedFeatures.combinedText);
    allCourses.forEach((course) => {
      const features = this.extractFeatures(course);
      this.tfidf.addDocument(features.combinedText);
    });

    // Calculate similarities
    const similarities = allCourses.map((course, index) => {
      // Skip the purchased course itself
      if (course.Course_Id === purchasedCourse.Course_Id) {
        return { course, score: -1 };
      }

      const courseFeatures = this.extractFeatures(course);

      // 1. TF-IDF Cosine Similarity (40% weight)
      const purchasedVector = {};
      const courseVector = {};

      this.tfidf.listTerms(0).forEach((term) => {
        purchasedVector[term.term] = term.tfidf;
      });

      this.tfidf.listTerms(index + 1).forEach((term) => {
        courseVector[term.term] = term.tfidf;
      });

      const textSimilarity = this.cosineSimilarity(
        purchasedVector,
        courseVector
      );

      // 2. Category Match (30% weight)
      const categoryMatch =
        purchasedFeatures.category.toLowerCase() ===
        courseFeatures.category.toLowerCase()
          ? 1
          : 0;

      // 3. Tags Similarity (20% weight)
      const purchasedTags = new Set(
        purchasedFeatures.tags
          .toLowerCase()
          .split(/[,\s]+/)
          .filter((t) => t.length > 0)
      );
      const courseTags = new Set(
        courseFeatures.tags
          .toLowerCase()
          .split(/[,\s]+/)
          .filter((t) => t.length > 0)
      );
      const tagsSimilarity = this.jaccardSimilarity(purchasedTags, courseTags);

      // 4. Level Match (10% weight)
      const levelMatch =
        purchasedFeatures.level === courseFeatures.level ? 1 : 0;

      // Combined weighted score
      const score =
        textSimilarity * 0.4 +
        categoryMatch * 0.3 +
        tagsSimilarity * 0.2 +
        levelMatch * 0.1;

      return {
        course,
        score,
        details: {
          textSimilarity: (textSimilarity * 100).toFixed(1),
          categoryMatch: categoryMatch === 1,
          tagsSimilarity: (tagsSimilarity * 100).toFixed(1),
          levelMatch: levelMatch === 1,
        },
      };
    });

    // Sort by score and return top N
    return similarities
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map((item) => ({
        ...item.course,
        matchScore: (item.score * 100).toFixed(0),
        matchDetails: item.details,
      }));
  }

  /**
   * Generate recommendations based on multiple enrolled courses
   */
  generateMultiCourseRecommendations(enrolledCourses, allCourses, topN = 10) {
    if (enrolledCourses.length === 0) {
      // If no enrolled courses, return popular courses
      return allCourses
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, topN)
        .map((course) => ({
          ...course,
          matchScore: "75",
          matchDetails: { reason: "Popular Course" },
        }));
    }

    // Get recommendations for each enrolled course
    const allRecommendations = [];

    enrolledCourses.forEach((enrolledCourse) => {
      const recs = this.generateRecommendations(
        enrolledCourse,
        allCourses,
        topN * 2
      );
      allRecommendations.push(...recs);
    });

    // Aggregate scores for courses that appear multiple times
    const courseScores = {};
    allRecommendations.forEach((rec) => {
      const courseId = rec.Course_Id || rec.id;
      if (!courseScores[courseId]) {
        courseScores[courseId] = {
          course: rec,
          totalScore: 0,
          count: 0,
        };
      }
      courseScores[courseId].totalScore += parseFloat(rec.matchScore);
      courseScores[courseId].count += 1;
    });

    // Calculate average scores and sort
    const recommendations = Object.values(courseScores)
      .map((item) => ({
        ...item.course,
        matchScore: (item.totalScore / item.count).toFixed(0),
      }))
      .sort((a, b) => parseFloat(b.matchScore) - parseFloat(a.matchScore))
      .slice(0, topN);

    return recommendations;
  }
}

module.exports = new RecommendationEngine();
