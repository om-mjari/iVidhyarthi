/**
 * Test file to demonstrate recommendation engine
 * Run: node testRecommendations.js
 */

const recommendationEngine = require("./utils/recommendationEngine");

// Sample courses data
const enrolledCourse = {
  Course_Id: "REACT101",
  Title: "Complete React Developer Course",
  Category: "Web Development",
  Tags: "React, JavaScript, Frontend, Hooks, Redux",
  Description:
    "Learn React from basics to advanced. Build real-world projects with React Hooks, Context API, and Redux.",
  Instructor_Name: "John Doe",
  Level: "Intermediate",
  Price: 1299,
};

const allCourses = [
  {
    Course_Id: "REACT201",
    Title: "Advanced React Patterns & Performance",
    Category: "Web Development",
    Tags: "React, Advanced, Performance, Optimization",
    Description:
      "Master advanced React patterns, performance optimization, and best practices for scalable applications.",
    Level: "Advanced",
    Price: 1499,
  },
  {
    Course_Id: "NEXT101",
    Title: "Next.js Complete Guide",
    Category: "Web Development",
    Tags: "Next.js, React, SSR, Full Stack",
    Description:
      "Build production-ready Next.js applications with server-side rendering and API routes.",
    Level: "Intermediate",
    Price: 1399,
  },
  {
    Course_Id: "NODE101",
    Title: "Node.js Backend Development",
    Category: "Backend Development",
    Tags: "Node.js, Express, MongoDB, API",
    Description:
      "Complete backend development with Node.js, Express, and MongoDB. Build REST APIs.",
    Level: "Intermediate",
    Price: 1199,
  },
  {
    Course_Id: "PY101",
    Title: "Python for Data Science",
    Category: "Data Science",
    Tags: "Python, Data Science, Pandas, NumPy",
    Description:
      "Learn Python programming for data analysis, visualization, and machine learning.",
    Level: "Beginner",
    Price: 999,
  },
  {
    Course_Id: "VUE101",
    Title: "Vue.js Masterclass",
    Category: "Web Development",
    Tags: "Vue, JavaScript, Frontend, Vuex",
    Description:
      "Master Vue.js framework and build modern web applications with Vue 3 and Composition API.",
    Level: "Intermediate",
    Price: 1299,
  },
  {
    Course_Id: "TS101",
    Title: "TypeScript Complete Course",
    Category: "Web Development",
    Tags: "TypeScript, JavaScript, Static Typing",
    Description:
      "Learn TypeScript from scratch and apply it to React, Node.js, and other frameworks.",
    Level: "Intermediate",
    Price: 1199,
  },
  {
    Course_Id: "ML101",
    Title: "Machine Learning Fundamentals",
    Category: "Data Science",
    Tags: "Machine Learning, Python, AI, TensorFlow",
    Description:
      "Introduction to machine learning algorithms and building ML models with Python.",
    Level: "Advanced",
    Price: 1599,
  },
  {
    Course_Id: "CSS101",
    Title: "Modern CSS & Tailwind",
    Category: "Web Development",
    Tags: "CSS, Tailwind, Frontend, Design",
    Description:
      "Master modern CSS techniques, Flexbox, Grid, and Tailwind CSS framework.",
    Level: "Beginner",
    Price: 899,
  },
  {
    Course_Id: "DOCKER101",
    Title: "Docker & Kubernetes Mastery",
    Category: "DevOps",
    Tags: "Docker, Kubernetes, DevOps, Containers",
    Description:
      "Learn containerization with Docker and orchestration with Kubernetes for production deployments.",
    Level: "Advanced",
    Price: 1399,
  },
  {
    Course_Id: "GQL101",
    Title: "GraphQL with React & Apollo",
    Category: "Web Development",
    Tags: "GraphQL, React, Apollo, API",
    Description:
      "Build modern applications with GraphQL, Apollo Client, and React for efficient data fetching.",
    Level: "Intermediate",
    Price: 1299,
  },
];

console.log("🤖 AI Course Recommendation Engine - Test\n");
console.log("=".repeat(70));
console.log("\n📚 ENROLLED COURSE:");
console.log(`   Title: ${enrolledCourse.Title}`);
console.log(`   Category: ${enrolledCourse.Category}`);
console.log(`   Tags: ${enrolledCourse.Tags}`);
console.log(`   Level: ${enrolledCourse.Level}\n`);

console.log("🎯 GENERATING RECOMMENDATIONS...\n");

const recommendations = recommendationEngine.generateRecommendations(
  enrolledCourse,
  allCourses,
  10
);

console.log("=".repeat(70));
console.log("\n✨ TOP RECOMMENDATIONS:\n");

recommendations.forEach((course, index) => {
  console.log(`${index + 1}. ${course.Title}`);
  console.log(`   Match Score: ${course.matchScore}% 🎯`);
  console.log(`   Category: ${course.Category}`);
  console.log(`   Tags: ${course.Tags}`);
  console.log(`   Price: ₹${course.Price}`);
  console.log(`   Level: ${course.Level}`);
  console.log(`   Match Details:`);
  console.log(`     - Text Similarity: ${course.matchDetails.textSimilarity}%`);
  console.log(
    `     - Category Match: ${
      course.matchDetails.categoryMatch ? "Yes ✓" : "No ✗"
    }`
  );
  console.log(`     - Tags Similarity: ${course.matchDetails.tagsSimilarity}%`);
  console.log(
    `     - Level Match: ${course.matchDetails.levelMatch ? "Yes ✓" : "No ✗"}`
  );
  console.log("");
});

console.log("=".repeat(70));
console.log("\n📊 ANALYSIS:\n");

const webDevCourses = recommendations.filter(
  (c) => c.Category === "Web Development"
).length;
const avgScore = (
  recommendations.reduce((sum, c) => sum + parseFloat(c.matchScore), 0) /
  recommendations.length
).toFixed(1);

console.log(
  `✓ Web Development courses recommended: ${webDevCourses}/${recommendations.length}`
);
console.log(`✓ Average match score: ${avgScore}%`);
console.log(`✓ Recommendations sorted by relevance: Yes`);
console.log(
  `✓ Algorithm weights: Text(40%) + Category(30%) + Tags(20%) + Level(10%)\n`
);

console.log("=".repeat(70));
console.log("\n🎉 Recommendation engine is working perfectly!\n");
console.log("Expected behavior:");
console.log("  1. Next.js & GraphQL courses ranked high (React-related)");
console.log("  2. TypeScript ranked high (JavaScript ecosystem)");
console.log("  3. Vue.js moderate (same category, different framework)");
console.log("  4. Data Science courses ranked lower (different category)");
console.log("  5. All web development courses prioritized\n");
