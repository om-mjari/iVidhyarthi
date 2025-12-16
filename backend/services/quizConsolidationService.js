const stringSimilarity = require('string-similarity');

class QuizConsolidationService {
  constructor() {
    this.similarityThreshold = 0.75;
    this.minQualityScore = 0.6;
    this.targetDistribution = {
      mcq: 15,
      short_answer: 10,
      conceptual: 5
    };
  }

  async consolidateQuestions(allQuestions) {
    console.log(`Consolidating ${allQuestions.length} questions...`);

    const questionsByType = this.groupByType(allQuestions);
    const deduplicated = this.deduplicateQuestions(questionsByType);
    const scored = this.scoreQuestions(deduplicated);
    const selected = this.selectBestQuestions(scored);

    console.log(`Final selection: ${selected.length} questions`);
    return selected;
  }

  groupByType(questions) {
    return {
      mcq: questions.filter(q => q.type === 'mcq'),
      short_answer: questions.filter(q => q.type === 'short_answer'),
      conceptual: questions.filter(q => q.type === 'conceptual')
    };
  }

  deduplicateQuestions(questionsByType) {
    const deduplicated = {};

    for (const [type, questions] of Object.entries(questionsByType)) {
      if (questions.length === 0) {
        deduplicated[type] = [];
        continue;
      }

      const unique = [];
      const seen = new Set();

      for (const question of questions) {
        const normalized = this.normalizeText(question.question);
        
        let isDuplicate = false;
        for (const seenText of seen) {
          const similarity = stringSimilarity.compareTwoStrings(normalized, seenText);
          if (similarity > this.similarityThreshold) {
            isDuplicate = true;
            break;
          }
        }

        if (!isDuplicate) {
          unique.push(question);
          seen.add(normalized);
        }
      }

      deduplicated[type] = unique;
      console.log(`${type}: ${questions.length} → ${unique.length} (removed ${questions.length - unique.length} duplicates)`);
    }

    return deduplicated;
  }

  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  scoreQuestions(questionsByType) {
    const scored = {};

    for (const [type, questions] of Object.entries(questionsByType)) {
      scored[type] = questions.map(q => ({
        ...q,
        qualityScore: this.calculateQualityScore(q)
      })).sort((a, b) => b.qualityScore - a.qualityScore);
    }

    return scored;
  }

  calculateQualityScore(question) {
    let score = 0;

    const questionLength = question.question.length;
    if (questionLength >= 20 && questionLength <= 200) {
      score += 0.3;
    }

    const words = question.question.split(/\s+/).length;
    if (words >= 5 && words <= 40) {
      score += 0.2;
    }

    if (question.type === 'mcq') {
      if (question.options && Object.keys(question.options).length === 4) {
        score += 0.2;
      }
      if (question.correctAnswer && ['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
        score += 0.15;
      }
      const optionLengths = Object.values(question.options || {}).map(o => o.length);
      const avgLength = optionLengths.reduce((a, b) => a + b, 0) / optionLengths.length;
      if (avgLength >= 10 && avgLength <= 80) {
        score += 0.15;
      }
    }

    if (question.type === 'short_answer' || question.type === 'conceptual') {
      const answerKey = question.type === 'short_answer' ? 'expectedAnswer' : 'keyPoints';
      if (question[answerKey] && question[answerKey].length >= 10) {
        score += 0.3;
      }
    }

    return Math.min(score, 1.0);
  }

  selectBestQuestions(scoredQuestions) {
    const selected = [];

    for (const [type, targetCount] of Object.entries(this.targetDistribution)) {
      const questions = scoredQuestions[type] || [];
      const filtered = questions.filter(q => q.qualityScore >= this.minQualityScore);
      
      const toSelect = Math.min(targetCount, filtered.length);
      selected.push(...filtered.slice(0, toSelect));

      console.log(`Selected ${toSelect}/${targetCount} ${type} questions (quality threshold: ${this.minQualityScore})`);
    }

    return selected.map((q, index) => ({
      ...q,
      questionNumber: index + 1,
      points: this.assignPoints(q.type)
    }));
  }

  assignPoints(type) {
    const pointsMap = {
      mcq: 1,
      short_answer: 2,
      conceptual: 3
    };
    return pointsMap[type] || 1;
  }

  calculateTotalPoints(questions) {
    return questions.reduce((total, q) => total + q.points, 0);
  }

  getQuestionDistribution(questions) {
    const distribution = {
      mcq: 0,
      short_answer: 0,
      conceptual: 0
    };

    questions.forEach(q => {
      if (distribution.hasOwnProperty(q.type)) {
        distribution[q.type]++;
      }
    });

    return distribution;
  }
}

module.exports = new QuizConsolidationService();
