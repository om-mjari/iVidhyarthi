const OpenAI = require('openai');

class AIQuizGenerationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    // Using OpenAI for stable quiz generation
    this.model = 'gpt-3.5-turbo';
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  async generateQuestionsFromChunk(chunkText) {
    const prompt = `You are an academic quiz generator. Based strictly on the following course material, generate quiz questions.

RULES:
- Use ONLY the provided content
- Do not invent topics outside the text
- Avoid duplicate questions
- Keep academic clarity

Generate exactly:
- 3 multiple choice questions (MCQ) with 4 options each
- 2 short answer questions
- 1 conceptual question

Output Format (STRICTLY FOLLOW):

MCQ:
Q1: [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]

SHORT:
Q1: [Question text]
ANSWER: [Expected answer]

CONCEPTUAL:
Q1: [Question text]
ANSWER: [Expected answer/key points]

COURSE MATERIAL:
${chunkText.substring(0, 2000)}

BEGIN GENERATION:`;

    try {
      const response = await this.callLLMWithRetry(prompt);
      return this.parseQuestions(response);
    } catch (error) {
      console.error('Error generating questions:', error.message);
      return [];
    }
  }

  async callLLMWithRetry(prompt) {
    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: "system",
              content: "You are an expert exam question generator. Generate questions strictly from provided content."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 500
        });
        return completion.choices[0].message.content;
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt}/${this.maxRetries} failed:`, error.message);
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * attempt;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    console.error('All retry attempts failed');
    throw lastError;
  }

  parseQuestions(response) {
    const questions = [];
    const sections = response.split(/(?=MCQ:|SHORT:|CONCEPTUAL:)/);

    for (const section of sections) {
      if (section.includes('MCQ:')) {
        questions.push(...this.parseMCQSection(section));
      } else if (section.includes('SHORT:')) {
        questions.push(...this.parseShortAnswerSection(section));
      } else if (section.includes('CONCEPTUAL:')) {
        questions.push(...this.parseConceptualSection(section));
      }
    }

    return questions;
  }

  parseMCQSection(section) {
    const mcqs = [];
    const questionBlocks = section.split(/Q\d+:/).filter(q => q.trim());

    for (const block of questionBlocks) {
      try {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        const questionText = lines[0];
        const options = {};
        let correctAnswer = '';

        for (const line of lines) {
          if (line.match(/^[A-D]\)/)) {
            const option = line.charAt(0);
            const text = line.substring(2).trim();
            options[option] = text;
          } else if (line.startsWith('CORRECT:')) {
            correctAnswer = line.split(':')[1].trim().charAt(0).toUpperCase();
          }
        }

        if (questionText && Object.keys(options).length === 4 && correctAnswer) {
          mcqs.push({
            type: 'mcq',
            question: questionText,
            options,
            correctAnswer,
            aiGenerated: true
          });
        }
      } catch (error) {
        console.error('Error parsing MCQ:', error.message);
      }
    }

    return mcqs;
  }

  parseShortAnswerSection(section) {
    const questions = [];
    const questionBlocks = section.split(/Q\d+:/).filter(q => q.trim());

    for (const block of questionBlocks) {
      try {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        const questionText = lines[0];
        let answer = '';

        for (const line of lines) {
          if (line.startsWith('ANSWER:')) {
            answer = line.substring(7).trim();
          }
        }

        if (questionText && answer) {
          questions.push({
            type: 'short_answer',
            question: questionText,
            expectedAnswer: answer,
            aiGenerated: true
          });
        }
      } catch (error) {
        console.error('Error parsing short answer:', error.message);
      }
    }

    return questions;
  }

  parseConceptualSection(section) {
    const questions = [];
    const questionBlocks = section.split(/Q\d+:/).filter(q => q.trim());

    for (const block of questionBlocks) {
      try {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        const questionText = lines[0];
        let answer = '';

        for (const line of lines) {
          if (line.startsWith('ANSWER:')) {
            answer = line.substring(7).trim();
          }
        }

        if (questionText && answer) {
          questions.push({
            type: 'conceptual',
            question: questionText,
            keyPoints: answer,
            aiGenerated: true
          });
        }
      } catch (error) {
        console.error('Error parsing conceptual question:', error.message);
      }
    }

    return questions;
  }

  async generateQuestionsFromChunks(chunks) {
    const allQuestions = [];
    console.log(`Generating questions from ${chunks.length} chunks...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const questions = await this.generateQuestionsFromChunk(chunk.text);
        questions.forEach(q => {
          q.chunkId = chunk.chunkId;
          q.source = chunk.source || 'unknown';
        });
        allQuestions.push(...questions);
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to generate questions from chunk ${i + 1}:`, error.message);
      }
    }

    return allQuestions;
  }
}

module.exports = new AIQuizGenerationService();
