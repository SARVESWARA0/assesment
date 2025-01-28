import type React from "react"
import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ImprovementArea {
  point: string
  example: string
}

interface QuickRecommendation {
  recommendation: string
  example: string
}

interface QuestionAnalysis {
  questionNumber: number
  keyCompetencies: string[]
  improvementAreas: ImprovementArea[]
  quickRecommendations: QuickRecommendation[]
}

interface AssessmentReportProps {
  results: {
    overallAssessment: {
      overallRating: number
      innovationScore: number
      communicationScore: number
    }
    detailedAnalysis: {
      innovation: QuestionAnalysis[]
      communication: QuestionAnalysis[]
    }
    behavioralAnalysis?: {
      timeEfficiency?: {
        rating?: string
        observations?: string[]
        impact?: string
      }
      responsePatterns?: {
        patterns?: string[]
        consistency?: string
        concerns?: string[]
      }
      interactionAnalysis?: {
        overview?: string
        keyBehaviors?: string[]
        recommendations?: string[]
      }
    }
    behavioralData?: BehavioralData
  }
}

interface BehavioralData {
  totalUnusualTypingCount: number
  totalTabSwitchCount: number
  totalPasteCount: number
}

const AccordionItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-700">
      <button
        className="flex justify-between items-center w-full py-4 px-6 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg font-medium">{title}</span>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {isOpen && <div className="p-6">{children}</div>}
    </div>
  )
}

const QuestionSection: React.FC<{ questionData: QuestionAnalysis; questionNumber: number }> = ({
  questionData,
  questionNumber,
}) => (
  <div className="mb-8">
    <h4 className="text-lg font-semibold mb-4">Question {questionNumber}</h4>
    <div className="space-y-6 pl-4">
      <div>
        <h5 className="text-md font-medium text-gray-300 mb-2">Key Competencies:</h5>
        <ul className="list-disc list-inside pl-4">
          {questionData.keyCompetencies.map((item, index) => (
            <li key={index} className="text-gray-300">
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h5 className="text-md font-medium text-gray-300 mb-2">Improvement Areas:</h5>
        <ul className="space-y-3 pl-4">
          {questionData.improvementAreas.map((item, index) => (
            <li key={index} className="text-gray-300">
              <div className="font-medium">• {item.point}</div>
              <div className="pl-4 text-gray-400 mt-1">
                <span className="font-medium">Example: </span>
                {item.example}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h5 className="text-md font-medium text-gray-300 mb-2">Quick Recommendations:</h5>
        <ul className="space-y-3 pl-4">
          {questionData.quickRecommendations.map((item, index) => (
            <li key={index} className="text-gray-300">
              <div className="font-medium">• {item.recommendation}</div>
              <div className="pl-4 text-gray-400 mt-1">
                <span className="font-medium">Example: </span>
                {item.example}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
)

const calculateDeductions = (behavioralData: BehavioralData | undefined): number => {
  if (!behavioralData) return 0
  
  let deductions = 0
  
  if (behavioralData.totalTabSwitchCount > 2) {
    deductions += 0.2
  }
  if (behavioralData.totalUnusualTypingCount > 4) {
    deductions += 0.2
  }
  if (behavioralData.totalPasteCount > 3) {
    deductions += 0.3
  }
  
  return deductions
}

const AssessmentReport: React.FC<AssessmentReportProps> = ({ results }) => {
  console.log("Received results in AssessmentReport:", results)
  
  const deductions = calculateDeductions(results.behavioralData)
  const adjustedOverallRating = Math.max(0, results.overallAssessment.overallRating - deductions)

  const chartData = [
    { name: "Innovation", score: results.overallAssessment.innovationScore },
    { name: "Communication", score: results.overallAssessment.communicationScore },
  ]

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 shadow-lg rounded-lg text-white mt-8">
      <h1 className="text-3xl font-bold mb-6">Assessment Report</h1>

      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Candidate Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-400">Name:</span>
            <span className="ml-2 text-white">SARVESWARA</span>
          </div>
          <div>
            <span className="text-gray-400">Assessment Date:</span>
            <span className="ml-2 text-white">{currentDate}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <AccordionItem title="Assessment Summary">
          <h3 className="text-xl font-medium mb-2">Performance Overview:</h3>
          <ul className="list-disc list-inside mb-4">
            <li>Overall Rating: {adjustedOverallRating.toFixed(2)} ⭐ out of 5</li>
            {/* <li>Time Management: {results.overallAssessment.timeManagement || "Not available"}</li> */}
          </ul>

          <h3 className="text-xl font-medium mb-2">Performance Breakdown:</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 2.5]} />
              <Tooltip />
              <Bar dataKey="score" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </AccordionItem>

        <AccordionItem title="Innovation Assessment">
          <div className="space-y-6">
            {results.detailedAnalysis.innovation.map((question) => (
              <QuestionSection
                key={question.questionNumber}
                questionData={question}
                questionNumber={question.questionNumber}
              />
            ))}
          </div>
        </AccordionItem>

        <AccordionItem title="Communication Assessment">
          <div className="space-y-6">
            {results.detailedAnalysis.communication.map((question) => (
              <QuestionSection
                key={question.questionNumber}
                questionData={question}
                questionNumber={question.questionNumber}
              />
            ))}
          </div>
        </AccordionItem>

        <AccordionItem title="Behavioral Insights">
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-medium mb-2">Time Efficiency:</h4>
              <p className="text-gray-300">{results.behavioralAnalysis?.timeEfficiency?.rating || 'Not available'}</p>
              {results.behavioralAnalysis?.timeEfficiency?.observations && (
                <ul className="list-disc list-inside mt-2">
                  {results.behavioralAnalysis.timeEfficiency.observations.map((observation, index) => (
                    <li key={index} className="text-gray-300">{observation}</li>
                  ))}
                </ul>
              )}
              {results.behavioralAnalysis?.timeEfficiency?.impact && (
                <p className="mt-2 text-gray-300">Impact: {results.behavioralAnalysis.timeEfficiency.impact}</p>
              )}
            </div>
            <div>
              <h4 className="text-lg font-medium mb-2">Response Patterns:</h4>
              {results.behavioralAnalysis?.responsePatterns?.patterns && (
                <ul className="list-disc list-inside">
                  {results.behavioralAnalysis.responsePatterns.patterns.map((pattern, index) => (
                    <li key={index} className="text-gray-300">{pattern}</li>
                  ))}
                </ul>
              )}
              {results.behavioralAnalysis?.responsePatterns?.consistency && (
                <p className="mt-2 text-gray-300">Consistency: {results.behavioralAnalysis.responsePatterns.consistency}</p>
              )}
              {results.behavioralAnalysis?.responsePatterns?.concerns && (
                <div className="mt-2">
                  <h5 className="text-md font-medium text-gray-300 mb-1">Concerns:</h5>
                  <ul className="list-disc list-inside">
                    {results.behavioralAnalysis.responsePatterns.concerns.map((concern, index) => (
                      <li key={index} className="text-gray-300">{concern}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-lg font-medium mb-2">Interaction Analysis:</h4>
              {results.behavioralAnalysis?.interactionAnalysis?.overview && (
                <p className="text-gray-300">{results.behavioralAnalysis.interactionAnalysis.overview}</p>
              )}
              {results.behavioralAnalysis?.interactionAnalysis?.keyBehaviors && (
                <div className="mt-2">
                  <h5 className="text-md font-medium text-gray-300 mb-1">Key Behaviors:</h5>
                  <ul className="list-disc list-inside">
                    {results.behavioralAnalysis.interactionAnalysis.keyBehaviors.map((behavior, index) => (
                      <li key={index} className="text-gray-300">{behavior}</li>
                    ))}
                  </ul>
                </div>
              )}
              {results.behavioralAnalysis?.interactionAnalysis?.recommendations && (
                <div className="mt-2">
                  <h5 className="text-md font-medium text-gray-300 mb-1">Recommendations:</h5>
                  <ul className="list-disc list-inside">
                    {results.behavioralAnalysis.interactionAnalysis.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-gray-300">{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-lg font-medium mb-2">Behavioral Analysis:</h4>
              {results.behavioralData ? (
                <ul className="list-disc list-inside">
                  <li>Unusual Typing Patterns: {results.behavioralData.totalUnusualTypingCount}</li>
                  <li>Tab Switching: {results.behavioralData.totalTabSwitchCount}</li>
                  <li>Copy/Paste Actions: {results.behavioralData.totalPasteCount}</li>
                </ul>
              ) : (
                <p>No behavioral data available.</p>
              )}
              <p className="mt-2 text-gray-300">Total Deductions: {deductions.toFixed(2)} stars</p>
            </div>
          </div>
        </AccordionItem>
      </div>
    </div>
  )
}

export default AssessmentReport
