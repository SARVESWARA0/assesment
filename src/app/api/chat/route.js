"use server"
import { generateObject } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
})

const systemPrompt = `
You are an advanced AI assistant specializing in modern assessment platforms, designed to evaluate candidates' innovation mindset and professional communication skills. Your task is to assess user responses based on a robust evaluation framework and generate a detailed, actionable report.

**Evaluation Framework:**
1. **Relevance to Question** (0-0.3point): First, analyze the response to determine if it directly addresses the question's intent. If the response is irrelevant or missing, assign 0 points and move to the next question. Clearly note "Irrelevant or Missing Response" and do not evaluate further aspects for that response.
2. **Innovation Assessment** (2.5 stars): For relevant responses only, evaluate creativity, originality, and problem-solving approach. Assign a lower score for generic or uninspired answers.
3. **Communication Assessment** (2.5 stars): For relevant responses only, assess clarity, coherence, and professionalism. Lower scores indicate poor structure, grammar issues, or lack of clarity.
4. **Time Management**: For each response, note whether it was delivered efficiently within the given duration. For missing or irrelevant responses, note "Not Applicable."

**Deductions for Behavioral Patterns (Affects Overall Rating):**
- **Excessive Tab Switching**: Deduct 0.2 stars if the candidate frequently switches between tabs during the session.
- **Unusual Typing Patterns**: Deduct 0.2 stars if erratic or inconsistent typing behavior is observed.
- **Multiple Copy/Paste Instances**: Deduct 0.3 stars for frequent use of copy/paste.
- **Time Overrun**: Deduct 0.3 stars if the response time exceeds 3 minutes for a particular question.

**Additional Instructions:**
- Begin by assessing relevance for each question. Skip further evaluation for irrelevant or missing responses and assign a 0 for relevance.
- Ensure detailed evaluations are only performed for relevant responses.
- Adjust the **Overall Rating** by factoring in any deductions for the behavioral patterns mentioned above.
- Provide constructive feedback for incomplete or low-scoring responses to help candidates improve.
- Maintain a professional, neutral, and encouraging tone throughout the assessment.

**Assessment Report Structure:**

**1. Executive Summary**
- **Candidate Profile**: 
  - Name and Details: SARVESWARA 
  - Assessment Date: [To be filled]
  - Total Time Duration: 45 minutes
  - Overall Rating: ⭐⭐⭐⭐⭐ (out of 5 stars, adjusted for deductions)
- **General Performance Overview**:
  - Key Achievements
  - Overall Observations

**2. Performance Breakdown**
- **Relevance to Question**: its mandatory for farther process
- **Innovation Score**: (out of 2.5 for relevant responses)
- **Communication Score**: (out of 2.5 for relevant responses)
- **Behavioral Analysis**: 
  - Behavioral traits observed (e.g., adaptability, persistence).
  - Highlights of professional demeanor.
- **Time Management**: Evaluation of timing and pacing during the response.

**3. Detailed Analysis**
- **Strengths & Areas for Development**:
  - Key Competencies: Detailed list of candidate strengths.
  - Improvement Areas: Targeted insights for growth.
  - Specific Examples: Examples supporting strengths and improvement areas.
  - Recommendations: Tailored suggestions for professional development.

- **Behavioral Insights**:
  - Time Efficiency: Analysis of response speed and prioritization.
  - Response Patterns: Trends in communication style or thought processes.
  - Interaction Analysis: Assessment of engagement, tone, and intent clarity.

**4. Actionable Recommendations**
- Customized growth plan aligned with candidate’s career objectives.
- Suggested resources for improving innovation and communication skills.

**Key Requirements:**
- Ensure behavioral deductions are applied to determine the final **Overall Rating**.
- Clearly document any observed behaviors leading to deductions in the report.
- Offer actionable feedback and support growth with specific recommendations.
- Maintain a professional and encouraging tone, fostering continuous improvement.

Ensure your analysis is comprehensive, well-structured, and tailored to support the candidate’s professional growth.
`;


const schema = z.object({
  response: z.object({
    overallAssessment: z.object({
      overallRating: z.number().min(0).max(5),
      innovationScore: z.number().min(0).max(2.5),
      communicationScore: z.number().min(0).max(2.5),
      timeManagement: z.string(),
      keyStrengths: z.array(z.string()),
      areasForImprovement: z.array(z.string()),
      specificExamples: z.array(z.string()),
      recommendations: z.array(z.string()),
    }),
    metadata: z.object({
      timeManagement: z.string(),
      timeEfficiency: z.string(),
      responsePatterns: z.string(),
      interactionAnalysis: z.string(),
      behavioralAnalysis: z.string(),
    }),
  }),
})

const preprocessResponse = (response) => {
  const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

  return {
    ...response,
    overallAssessment: {
      ...response.overallAssessment,
      innovationScore: clamp(response.overallAssessment.innovationScore, 0, 2.5),
      communicationScore: clamp(response.overallAssessment.communicationScore, 0, 2.5),
      overallRating: clamp(response.overallAssessment.overallRating, 0, 5),
    },
  }
}

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
        timeTaken: data?.timeTaken || 0,
        responseTime: data?.responseTime || 0,
        pasteCount: data?.pasteCount || 0,
        tabSwitchCount: data?.tabSwitchCount || 0,
        unusualTypingCount: data?.unusualTypingCount || 0,
      })),
      ...Object.entries(body.professionalCommunication).map(([index, data]) => ({
        type: "Professional Communication",
        subject: data?.subject || "N/A",
        context: data?.context || "N/A",
        instructions: data?.instructions || "N/A",
        response: data?.response || "No response provided",
        timeTaken: data?.timeTaken || 0,
        responseTime: data?.responseTime || 0,
        pasteCount: data?.pasteCount || 0,
        tabSwitchCount: data?.tabSwitchCount || 0,
        unusualTypingCount: data?.unusualTypingCount || 0,
      })),
    ]

    const combinedPrompt = `${systemPrompt}\n\nUser Responses:\n${processedResponses
      .map((response) => {
        let baseInfo = `${response.type}\n`
        if (response.type === "Innovation Mindset") {
          baseInfo += `Question: ${response.question}\n`
        } else if (response.type === "Professional Communication") {
          baseInfo += `Subject: ${response.subject}\nContext: ${response.context}\nInstructions: ${response.instructions}\n`
        }
        return `${baseInfo}Response: ${response.response}\nTime Taken: ${response.timeTaken} minutes\nResponse Time: ${response.responseTime} seconds\nPaste Count: ${response.pasteCount}\nTab Switch Count: ${response.tabSwitchCount}\nUnusual Typing Count: ${response.unusualTypingCount}`
      })
      .join(
        "\n\n",
      )}\n\nOverall Behavioral Data:\nTotal Paste Count: ${body.behavioralData.totalPasteCount}\nTotal Tab Switch Count: ${body.behavioralData.totalTabSwitchCount}\nTotal Unusual Typing Count: ${body.behavioralData.totalUnusualTypingCount}`

    console.log("Combined Prompt:", combinedPrompt)

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-exp"),
      schema: schema,
      prompt: combinedPrompt,
      preprocess: preprocessResponse,
    })
    console.log("Generated assessment object:", object.response)
    return new Response(JSON.stringify(object.response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error during assessment processing:", error)
    return new Response(JSON.stringify({ error: "Failed to process the assessment. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

