"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { ChevronRight, Clock, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import LoadingSpinner from "./LoadingSpinner"
import DetailedAssessmentResults from "./DetailedAssessmentResults"
import FeedbackForm from "./FeedbackForm"
import ConfirmationModal from "./ConfirmationModal"
import ProgressIndicator from "./ProgressIndicator"
import { detectUnusualTyping } from "../utils/detectUnusualTyping"

const questions = [
  "Describe a time when you had to adapt quickly to a significant change in your work environment. What steps did you take, and what was the outcome?",
  "How do you approach identifying and solving problems that haven't been encountered before?",
  "Share an example of a time when you successfully implemented a new idea or process. What challenges did you face, and how did you overcome them?",
  "How do you stay informed about the latest trends and developments in your field? How do you apply this knowledge to your work?",
  "Imagine you're facing a tight deadline with limited resources. How would you approach prioritizing tasks and making critical decisions?",
]

const emailScenarios = [
  {
    subject: "Delayed Project Delivery",
    context: "A critical project for a hospital is behind schedule due to unforeseen technical challenges.",
    instructions:
      "Draft an email to the hospital's IT Director, acknowledging the delay, explaining the root cause, outlining the revised timeline, and proposing mitigation strategies to minimize disruption.",
  },
  {
    subject: "Request for Meeting to Discuss New Business Opportunity",
    context: "You're a sales manager at a software company and have identified a potential new client.",
    instructions:
      "Draft an email to the client's CEO, introducing yourself, highlighting the benefits of your product, and requesting a meeting to discuss further.",
  },
  {
    subject: "Apology and Resolution for Customer Complaint",
    context: "A customer has complained about a defective product and poor customer service.",
    instructions:
      "Draft an email to the customer, apologizing for the issue, explaining the steps being taken to resolve it, and offering compensation or a replacement product.",
  },
  {
    subject: "Notification of Changes to Company Policies",
    context: "Your company is updating its employee handbook and policies.",
    instructions:
      "Draft an email to all employees, summarizing the key changes, explaining the rationale behind them, and providing resources for further information.",
  },
  {
    subject: "Recommendation for Team Member's Promotion",
    context: "You're a manager and one of your team members is eligible for promotion.",
    instructions:
      "Draft an email to HR or the relevant decision-maker, outlining the team member's achievements, strengths, and reasons why they're suitable for promotion.",
  },
]

const timerRef = { current: null }

export default function AssessmentPage() {
  const [responses, setResponses] = useState({})
  const [timing, setTiming] = useState({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [currentSection, setCurrentSection] = useState("innovationMindset")
  const [assessmentResults, setAssessmentResults] = useState(null)
  const [totalTimeTaken, setTotalTimeTaken] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [pasteCount, setPasteCount] = useState(0)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [unusualTypingCount, setUnusualTypingCount] = useState(0)
  const [blockCopyPaste, setBlockCopyPaste] = useState(false) // Added state for copy-paste toggle
  const router = useRouter()
  const [showFeedback, setShowFeedback] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleEnd = useCallback(
    (index, section) => {
      clearInterval(timerRef.current)
      timerRef.current = null
      const endTime = Date.now()
      const startTime = timing[index]?.startTime
      if (startTime) {
        const timeTaken = ((endTime - startTime) / 60000).toFixed(2)
        setTiming((prev) => ({
          ...prev,
          [index]: { ...prev[index], timeTaken },
        }))
        setResponses((prev) => ({
          ...prev,
          [section]: {
            ...prev[section],
            [index]: { ...prev[section]?.[index], timeTaken },
          },
        }))
      }
    },
    [timing],
  )

  const handleStart = useCallback(
    (index) => {
      setTiming((prev) => {
        if (prev[index] && prev[index].startTime) {
          // Timer already started, don't update
          return prev
        }
        return { ...prev, [index]: { startTime: Date.now(), timeLeft: 180 } }
      })

      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setTiming((prev) => {
            const currentTiming = prev[index]
            if (!currentTiming || currentTiming.timeLeft <= 0) {
              clearInterval(timerRef.current)
              timerRef.current = null
              handleEnd(index, currentSection)
              return prev
            }
            return {
              ...prev,
              [index]: { ...currentTiming, timeLeft: currentTiming.timeLeft - 1 },
            }
          })
        }, 1000)
      }
    },
    [currentSection, handleEnd],
  )

  const handleResponse = (section, index, value) => {
    const currentTime = Date.now()
    const startTime = timing[index]?.startTime || currentTime
    const responseTime = (currentTime - startTime) / 1000

    let questionData

    if (section === "innovationMindset") {
      questionData = { question: questions[index] }
    } else if (section === "professionalCommunication") {
      const emailScenario = emailScenarios[index]
      questionData = {
        subject: emailScenario.subject,
        context: emailScenario.context,
        instructions: emailScenario.instructions,
      }
    }

    const isUnusualTyping = detectUnusualTyping(value, responseTime)
    if (isUnusualTyping) {
      setUnusualTypingCount((prev) => prev + 1)
    }

    setResponses((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [index]: {
          ...prev[section]?.[index],
          response: value,
          responseTime: responseTime,
          timeTaken: timing[index]?.timeTaken || 0,
          pasteCount: prev[section]?.[index]?.pasteCount || 0,
          tabSwitchCount: prev[section]?.[index]?.tabSwitchCount || 0,
          unusualTypingCount: (prev[section]?.[index]?.unusualTypingCount || 0) + (isUnusualTyping ? 1 : 0),
          ...questionData,
        },
      },
    }))
  }

  const handleCopyPaste = (e) => {
    setPasteCount((prev) => prev + 1)
    setResponses((prev) => ({
      ...prev,
      [currentSection]: {
        ...prev[currentSection],
        [currentQuestion]: {
          ...prev[currentSection]?.[currentQuestion],
          pasteCount: (prev[currentSection]?.[currentQuestion]?.pasteCount || 0) + 1,
        },
      },
    }))
    if (blockCopyPaste) {
      e.preventDefault()
    }
  }

  const handleSubmit = useCallback(async () => {
    setShowConfirmation(true)
    const timeOverrun = Object.values(timing).some((t) => t.timeLeft <= 0) //Added time overrun check
    const timeOverrunDeduction = timeOverrun ? 0.3 : 0 //Added time overrun deduction

    // Prepare behavioral data
    const behavioralData = {
      totalPasteCount: pasteCount,
      totalTabSwitchCount: tabSwitchCount,
      totalUnusualTypingCount: unusualTypingCount,
      timeOverrun: timeOverrun, //Added time overrun to behavioral data
    }

    // Prepare the payload
    const payload = {
      innovationMindset: Object.entries(responses.innovationMindset || {}).reduce((acc, [index, data]) => {
        if (data && data.response) {
          acc[index] = {
            ...data,
            question: questions[Number(index)],
            pasteCount: data.pasteCount || 0,
            tabSwitchCount: data.tabSwitchCount || 0,
            unusualTypingCount: data.unusualTypingCount || 0,
          }
        }
        return acc
      }, {}),
      professionalCommunication: Object.entries(responses.professionalCommunication || {}).reduce(
        (acc, [index, data]) => {
          if (data && data.response) {
            acc[index] = {
              ...data,
              subject: emailScenarios[Number(index)].subject,
              context: emailScenarios[Number(index)].context,
              instructions: emailScenarios[Number(index)].instructions,
              pasteCount: data.pasteCount || 0,
              tabSwitchCount: data.tabSwitchCount || 0,
              unusualTypingCount: data.unusualTypingCount || 0,
            }
          }
          return acc
        },
        {},
      ),
      behavioralData,
    }

    // Send behavior data to backend
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to submit assessment.")
      }
      const data = await res.json()
      console.log("Assessment submitted successfully:", data)
      setAssessmentResults(data)
    } catch (error) {
      console.error("Failed to send assessment data:", error)
      alert(error.message)
    }
  }, [responses, pasteCount, tabSwitchCount, unusualTypingCount, questions, emailScenarios, timing])

  const confirmSubmit = async () => {
    setShowConfirmation(false)
    setIsLoading(true)
    try {
      const innovationMindsetResponses = Object.entries(responses.innovationMindset || {}).reduce(
        (acc, [index, data]) => {
          if (data && data.response) {
            acc[index] = {
              ...data,
              question: questions[Number(index)],
            }
          }
          return acc
        },
        {},
      )
  
      const professionalCommunicationResponses = Object.entries(responses.professionalCommunication || {}).reduce(
        (acc, [index, data]) => {
          if (data && data.response) {
            acc[index] = {
              ...data,
              subject: emailScenarios[Number(index)].subject,
              context: emailScenarios[Number(index)].context,
              instructions: emailScenarios[Number(index)].instructions,
            }
          }
          return acc
        },
        {},
      )
  
      const payload = {
        innovationMindset: innovationMindsetResponses,
        professionalCommunication: professionalCommunicationResponses,
        behavioralData: {
          totalPasteCount: pasteCount,
          totalTabSwitchCount: tabSwitchCount,
          totalUnusualTypingCount: unusualTypingCount,
        },
      }
  
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
  
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
  
      const data = await res.json()
      console.log("Assessment submitted successfully:", data)
  
      // Ensure the data structure matches what DetailedAssessmentResults expects
      setAssessmentResults({
        overallAssessment: {
          overallRating: data.overallAssessment.overallRating,
          innovationScore: data.overallAssessment.innovationScore,
          communicationScore: data.overallAssessment.communicationScore,
        },
        detailedAnalysis: {
          innovation: data.detailedAnalysis.innovation,
          communication: data.detailedAnalysis.communication,
        },
        behavioralAnalysis: data.behavioralAnalysis,
        behavioralData: {
          totalUnusualTypingCount: unusualTypingCount,
          totalTabSwitchCount: tabSwitchCount,
          totalPasteCount: pasteCount,
        },
      })
      
      setIsLoading(false)
    } catch (error) {
      console.error("Error submitting assessment:", error)
      setIsLoading(false)
      alert(error.message)
    }
  }
  const handleNext = () => {
    const currentResponse = responses[currentSection]?.[currentQuestion]?.response || ""
    if (currentResponse.trim().split(/\s+/).length < 5) {
      setErrorMessage("Please provide an answer with at least 5 words before moving to the next question.")
      return
    }
    setErrorMessage("")
    handleEnd(currentQuestion, currentSection)
    if (currentSection === "innovationMindset" && currentQuestion === questions.length - 1) {
      setCurrentSection("professionalCommunication")
      setCurrentQuestion(0)
    } else if (currentSection === "professionalCommunication" && currentQuestion === emailScenarios.length - 1) {
      handleSubmit()
    } else {
      setCurrentQuestion((prev) => prev + 1)
    }
    handleStart(currentQuestion + 1)

    const remainingTime = timing[currentQuestion]?.timeLeft
    const timeTaken = 180 - remainingTime
    setTotalTimeTaken(totalTimeTaken + timeTaken)
  }

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1)
        setResponses((prev) => ({
          ...prev,
          [currentSection]: {
            ...prev[currentSection],
            [currentQuestion]: {
              ...prev[currentSection]?.[currentQuestion],
              tabSwitchCount: (prev[currentSection]?.[currentQuestion]?.tabSwitchCount || 0) + 1,
            },
          },
        }))
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [currentSection, currentQuestion])

  useEffect(() => {
    const handleCopy = () => {
      setPasteCount((prev) => prev + 1)
      setResponses((prev) => ({
        ...prev,
        [currentSection]: {
          ...prev[currentSection],
          [currentQuestion]: {
            ...prev[currentSection]?.[currentQuestion],
            pasteCount: (prev[currentSection]?.[currentQuestion]?.pasteCount || 0) + 1,
          },
        },
      }))
    }

    document.addEventListener("copy", handleCopy)
    return () => {
      document.removeEventListener("copy", handleCopy)
    }
  }, [currentSection, currentQuestion])

  useEffect(() => {
    const preventCopy = (e) => {
      if (blockCopyPaste) {
        e.preventDefault()
      }
    }

    document.addEventListener("copy", preventCopy)
    return () => {
      document.removeEventListener("copy", preventCopy)
    }
  }, [blockCopyPaste])

  useEffect(() => {
    handleStart(currentQuestion)
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [currentQuestion, handleStart])

  const currentQuestionData =
    currentSection === "innovationMindset" ? questions[currentQuestion] : emailScenarios[currentQuestion]

  const totalQuestions = questions.length + emailScenarios.length
  const currentQuestionNumber =
    currentSection === "innovationMindset" ? currentQuestion + 1 : questions.length + currentQuestion + 1

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <ProgressIndicator currentQuestion={currentQuestionNumber} totalQuestions={totalQuestions} />
        <div className="mb-4 flex items-center justify-end">
          <label htmlFor="blockCopyPaste" className="mr-2 text-sm text-gray-300">
            Block Copy/Paste:
          </label>
          <input
            type="checkbox"
            id="blockCopyPaste"
            checked={blockCopyPaste}
            onChange={(e) => setBlockCopyPaste(e.target.checked)}
            className="form-checkbox h-5 w-5 text-indigo-600"
          />
        </div>
        <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-indigo-600 text-white">
            <h1 className="text-3xl font-bold">Student Assessment</h1>
            <p className="mt-1 text-indigo-200">
              {currentSection === "innovationMindset"
                ? "Part A: Innovation Mindset"
                : "Part B: Professional Communication"}
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-400">
                Question {currentQuestionNumber} of {totalQuestions}
              </span>
              <div className="flex items-center text-indigo-400">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-mono text-lg">
                  {Math.floor(timing[currentQuestion]?.timeLeft / 60)}:
                  {(timing[currentQuestion]?.timeLeft % 60).toString().padStart(2, "0")}
                </span>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              {currentSection === "innovationMindset"
                ? `Question ${currentQuestionNumber}`
                : currentQuestionData.subject}
            </h2>

            {currentSection === "professionalCommunication" && (
              <div className="mb-4 p-4 bg-gray-700 rounded-md">
                <p className="text-sm text-gray-300">
                  <strong>Context:</strong> {currentQuestionData.context}
                </p>
              </div>
            )}

            <p className="text-gray-300 mb-4">
              {currentSection === "innovationMindset" ? currentQuestionData : currentQuestionData.instructions}
            </p>

            <textarea
              className="w-full p-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={6}
              placeholder="Type your answer here..."
              onChange={(e) => handleResponse(currentSection, currentQuestion, e.target.value)}
              onPaste={handleCopyPaste}
              value={responses[currentSection]?.[currentQuestion]?.response || ""}
            ></textarea>

            {errorMessage && (
              <div className="mt-2 text-red-500">
                <AlertCircle className="w-5 h-5 inline mr-2" />
                {errorMessage}
              </div>
            )}

            <div className="mt-6 flex justify-between items-center">
              <div className="flex items-center text-yellow-400">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="text-sm">Answer within the time limit for best results</span>
              </div>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 flex items-center"
              >
                {currentQuestionNumber === totalQuestions ? "Submit" : "Next"}
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {isLoading && <LoadingSpinner />}
        {showFeedback && <FeedbackForm onSubmit={() => setShowFeedback(false)} />}
        {assessmentResults && <DetailedAssessmentResults results={assessmentResults} />}
        
        <ConfirmationModal
          isOpen={showConfirmation}
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirmation(false)}
        />
      </div>
    </div>
  )
}


