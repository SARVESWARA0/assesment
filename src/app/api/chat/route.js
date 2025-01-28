"use server"
import { generateObject, generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
})

const systemPrompt = `
You are an advanced AI assistant specializing in modern assessment platforms, designed to evaluate candidates' innovation mindset and professional communication skills. Your task is to assess user responses based on a robust evaluation framework and generate a detailed, actionable report.

EVALUATION GUIDELINES:

1. RELEVANCE CHECK (Critical First Step):
   - Score 0-0.3 points
   - Must FIRST verify if response directly addresses the specific question/prompt
   - For irrelevant responses:
     * Assign 0 points
     * Mark as "Irrelevant Response"
     * Clearly explain why it's irrelevant
     * Provide an example of what a relevant response should include

2. INNOVATION ASSESSMENT (For relevant responses only):
   - Score 0-2.5 stars
   - Evaluate:
     * Originality of ideas
     * Problem-solving approach
     * Creative thinking
     * Unique perspectives
   - Look for:
     * Novel solutions
     * Out-of-box thinking
     * Practical innovation
     * Strategic thinking

3. COMMUNICATION ASSESSMENT (For relevant responses only):
   - Score 0-2.5 stars
   - Evaluate:
     * Clarity of expression
     * Structure and organization
     * Professional tone
     * Audience awareness
   - Look for:
     * Clear messaging
     * Logical flow
     * Appropriate formality
     * Effective persuasion

4. RESPONSE-SPECIFIC EVALUATION:

For Professional Communication Tasks:
- CHECK FIRST: Does the response match the required format (email, report, etc.)?
- Verify if all required components are present (subject line, greeting, signature, etc.)
- Assess if tone matches the context (formal/informal as appropriate)
- Evaluate if key message points are clearly conveyed
- Check for proper business communication etiquette

For Innovation Mindset Tasks:
- CHECK FIRST: Does the response address the core problem/challenge?
- Evaluate uniqueness of proposed solution
- Assess practicality and feasibility
- Look for evidence of analytical thinking
- Check for consideration of various perspectives

FEEDBACK STRUCTURE:

1. Key Competencies (2-3 points):
   - Must be specific to the actual response
   - Include concrete examples from the response
   Example for Professional Communication:
   ❌ "Good email structure" (too vague)
   ✅ "Effective use of bullet points to highlight three key policy changes, making information easily scannable"

2. Improvement Areas (2-3 points):
   - Point: Clear statement of what needs improvement
   - Example: MUST quote or reference specific part of response
   - Solution: MUST provide specific guidance on how to improve
   Example:
   ❌ "Need to be more specific" (too vague)
   ✅ "Missing specific achievements of team member. Instead of saying 'has performed well', should list concrete examples like 'led the Q4 project to 30% over target'"

3. Quick Recommendations (2-3 points):
   - Each recommendation must include:
     * What to do differently
     * Specific example of how to do it
     * Expected improvement outcome
   Example:
   ❌ "Make it more professional" (too vague)
   ✅ "Replace casual phrases like 'great job' with specific accomplishments. Example: Change 'Jane has done great work' to 'Jane increased team productivity by 25% through implementation of agile methodologies'"

EXAMPLE EVALUATION:

Question: Draft a promotion recommendation email
Response: [Generic policy update email]

Evaluation:
- Relevance: 0 points - Response is completely irrelevant (policy update instead of promotion recommendation)
- Key Issue: Response template appears to be copied from a different context
- Specific Example of Irrelevance: Email discusses "updates to employee handbook" instead of team member's achievements
- What a Relevant Response Should Include:
  * Team member's name and current role
  * Specific achievements and metrics
  * Impact on team/organization
  * Clear recommendation for promotion
  * Examples of leadership potential

IMPORTANT RULES:
1. NEVER praise irrelevant responses
2. ALWAYS provide specific examples from the response in feedback
3. ALWAYS give actionable, concrete recommendations
4. NEVER use generic feedback templates
5. ALWAYS verify response matches required format/context
6. ALWAYS include "instead of X, write Y" examples in recommendations

Remember: Your evaluation must be specific, actionable, and directly tied to the response content. Generic feedback is not acceptable.`


const schema = z.object({
  response: z.object({
    overallAssessment: z.object({
      overallRating: z.number().min(0).max(5),
      innovationScore: z.number().min(0).max(2.5),
      communicationScore: z.number().min(0).max(2.5),
    }),
    detailedAnalysis: z.object({
      innovation: z.array(
        z.object({
          questionNumber: z.number().min(1).max(5),
          keyCompetencies: z.array(z.string()).default([]),
          improvementAreas: z.array(
            z.object({
              point: z.string(),
              example: z.string(),
            })
          ).default([]),
          quickRecommendations: z.array(
            z.object({
              recommendation: z.string(),
              example: z.string(),
            })
          ).default([]),
        })
      ).length(5),
      communication: z.array(
        z.object({
          questionNumber: z.number().min(6).max(10), // Changed to handle questions 6-10
          keyCompetencies: z.array(z.string()).default([]),
          improvementAreas: z.array(
            z.object({
              point: z.string(),
              example: z.string(),
            })
          ).default([]),
          quickRecommendations: z.array(
            z.object({
              recommendation: z.string(),
              example: z.string(),
            })
          ).default([]),
        })
      ).length(5),
    }),
  }),
});

// Helper function to preprocess the response before validation
const preprocessResponse = (response) => {
  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
  
  // Ensure arrays have exactly 5 elements with correct question numbering
  const padInnovation = (arr, length = 5) => {
    const padded = [...arr];
    while (padded.length < length) {
      const questionNumber = padded.length + 1; // Questions 1-5
      padded.push({
        questionNumber,
        keyCompetencies: [],
        improvementAreas: [],
        quickRecommendations: []
      });
    }
    return padded;
  };

  const padCommunication = (arr, length = 5) => {
    const padded = [...arr];
    while (padded.length < length) {
      const questionNumber = padded.length + 6; // Questions 6-10
      padded.push({
        questionNumber,
        keyCompetencies: [],
        improvementAreas: [],
        quickRecommendations: []
      });
    }
    return padded;
  };

  // Ensure both sections exist and have 5 questions each with correct numbering
  const innovation = padInnovation(response.detailedAnalysis?.innovation || []);
  const communication = padCommunication(response.detailedAnalysis?.communication || []);

  return {
    ...response,
    overallAssessment: {
      ...response.overallAssessment,
      innovationScore: clamp(response.overallAssessment.innovationScore, 0, 2.5),
      communicationScore: clamp(response.overallAssessment.communicationScore, 0, 2.5),
      overallRating: clamp(response.overallAssessment.overallRating, 0, 5),
    },
    detailedAnalysis: {
      innovation,
      communication
    }
  };
};
const behavioralSchema = z.object({
  behavioralAnalysis: z.object({
    timeEfficiency: z.object({
      rating: z.string(),
      observations: z.array(z.string()),
      impact: z.string()
    }),
    responsePatterns: z.object({
      patterns: z.array(z.string()),
      consistency: z.string(),
      concerns: z.array(z.string()).optional()
    }),
    interactionAnalysis: z.object({
      overview: z.string(),
      keyBehaviors: z.array(z.string()),
      recommendations: z.array(z.string())
    })
  })
})



export async function POST(req) {
  try {
    const body = await req.json()
    console.log("Received assessment data:", body)
    if (!body.innovationMindset || !body.professionalCommunication || !body.behavioralData) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid request format. Expected 'innovationMindset', 'professionalCommunication', and 'behavioralData' sections.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const processedResponses = [
      ...Object.entries(body.innovationMindset).map(([index, data]) => ({
        type: "Innovation Mindset",
        question: data?.question || "N/A",
        response: data?.response || "No response provided",
      })),
      ...Object.entries(body.professionalCommunication).map(([index, data]) => ({
        type: "Professional Communication",
        subject: data?.subject || "N/A",
        context: data?.context || "N/A",
        instructions: data?.instructions || "N/A",
        response: data?.response || "No response provided",
      })),
    ]

    const combinedPrompt = `${systemPrompt}\n\nUser Responses:\n${processedResponses.map((response) => {
      let baseInfo = `${response.type}\n`
      if (response.type === "Innovation Mindset") {
        baseInfo += `Question: ${response.question}\n`
      } else if (response.type === "Professional Communication") {
        baseInfo += `Subject: ${response.subject}\nContext: ${response.context}\nInstructions: ${response.instructions}\n`
      }
      return `${baseInfo}Response: ${response.response}`
    })}`

    console.log("Combined Prompt:", combinedPrompt)

    const { object: assessmentObject } = await generateObject({
      model: google("gemini-2.0-flash-exp"),
      schema: schema,
      prompt: combinedPrompt,
      preprocess: preprocessResponse,
    })
    const behavioralInsightsPrompt = `
    Analyze the following behavioral data and provide a detailed structured analysis:
    
    Behavioral Metrics:
    - Unusual Typing Patterns: ${body.behavioralData.totalUnusualTypingCount}
    - Tab Switching: ${body.behavioralData.totalTabSwitchCount}
    - Copy/Paste Actions: ${body.behavioralData.totalPasteCount}
    - Time Overrun: ${body.behavioralData.timeOverrun ? "Yes" : "No"}

    Please provide:
    1. Time Efficiency Analysis:
       - Rate the overall efficiency
       - List specific time-related observations
       - Describe the impact on assessment quality
    
    2. Response Pattern Analysis:
       - Identify consistent patterns
       - Note any irregularities
       - List potential concerns if any
    
    3. Interaction Analysis:
       - Provide an overview of interaction style
       - List key observed behaviors
       - Suggest improvements or recommendations
    
    Format the response according to the provided schema structure.
    `

    const { object: behavioralAnalysis } = await generateObject({
      model: google("gemini-2.0-flash-exp"),
      schema: behavioralSchema,
      prompt: behavioralInsightsPrompt
    })

    const finalResponse = {
      ...assessmentObject.response,
      behavioralAnalysis: behavioralAnalysis.behavioralAnalysis
    }

    console.log("Generated assessment object:", finalResponse)
    return new Response(JSON.stringify(finalResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Error during assessment processing:", error)
    return new Response(JSON.stringify({ error: "Failed to process the assessment. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
