import type React from "react"
import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChevronDown, ChevronUp } from "lucide-react"

interface AssessmentReportProps {
  results: {
    overallAssessment: {
      overallRating: number
      innovationScore: number
      communicationScore: number
      timeManagement: string
      keyStrengths: string[]
      areasForImprovement: string[]
      specificExamples: string[]
      recommendations: string[]
    }
    metadata: {
      timeManagement: string
      timeEfficiency: string
      responsePatterns: string
      interactionAnalysis: string
    }
  }
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

const AssessmentReport: React.FC<AssessmentReportProps> = ({ results }) => {
  const chartData = [
    { name: "Innovation", score: results.overallAssessment.innovationScore },
    { name: "Communication", score: results.overallAssessment.communicationScore },
  ]

  // Get current date in a readable format
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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
            <li>Overall Rating: {results.overallAssessment.overallRating} ⭐ out of 5</li>
            <li>Time Management: {results.overallAssessment.timeManagement}</li>
          </ul>

          <h3 className="text-xl font-medium mb-2">Performance Breakdown:</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Bar dataKey="score" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </AccordionItem>

        <AccordionItem title="Detailed Analysis">
          <h3 className="text-xl font-medium mb-2">Strengths & Areas for Development:</h3>
          <div className="mb-4">
            <h4 className="text-lg font-medium">Key Competencies:</h4>
            <ul className="list-disc list-inside">
              {results.overallAssessment.keyStrengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
          <div className="mb-4">
            <h4 className="text-lg font-medium">Improvement Areas:</h4>
            <ul className="list-disc list-inside">
              {results.overallAssessment.areasForImprovement.map((area, index) => (
                <li key={index}>{area}</li>
              ))}
            </ul>
          </div>
        </AccordionItem>

        <AccordionItem title="Specific Examples">
          <ul className="list-disc list-inside">
            {results.overallAssessment.specificExamples.map((example, index) => (
              <li key={index} className="mb-2">{example}</li>
            ))}
          </ul>
        </AccordionItem>

        <AccordionItem title="Recommendations">
          <ul className="list-disc list-inside">
            {results.overallAssessment.recommendations.map((recommendation, index) => (
              <li key={index} className="mb-2">{recommendation}</li>
            ))}
          </ul>
        </AccordionItem>

        <AccordionItem title="Behavioral Insights">
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-medium mb-2">Time Management:</h4>
              <p className="text-gray-300">{results.metadata.timeManagement}</p>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-2">Time Efficiency:</h4>
              <p className="text-gray-300">{results.metadata.timeEfficiency}</p>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-2">Response Patterns:</h4>
              <p className="text-gray-300">{results.metadata.responsePatterns}</p>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-2">Interaction Analysis:</h4>
              <p className="text-gray-300">{results.metadata.interactionAnalysis}</p>
            </div>
          </div>
        </AccordionItem>
      </div>
    </div>
  )
}

export default AssessmentReport