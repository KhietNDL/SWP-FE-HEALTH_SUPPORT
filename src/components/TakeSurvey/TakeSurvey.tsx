import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { surveyApi, surveyTypeApi, surveyResultApi } from "../../services/SurveyApiService";
import { toastConfig } from "../../types/toastConfig";
import "react-toastify/dist/ReactToastify.css";
import "./TakeSurvey.scss";
import { Question } from "../../types/Question";

interface SurveyData {
  id: string;
  surveyTypeId?: string;
  surveyName: string;
  maxScore: number;
  questionList: Question[];
}

interface StoredSurveyProgress {
  selectedAnswers: Record<string, string>;
  currentQuestion: number;
}

const TakeSurvey: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  
  // Survey state
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Progress state
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  // Fetch survey data
  const fetchSurveyData = useCallback(async () => {
    if (!surveyId) {
      toast.error("Không tìm thấy mã khảo sát!", toastConfig);
      navigate("/survey");
      return;
    }

    setLoading(true);
    try {
      // Get all surveys to find the current one
      const surveys = await surveyApi.getAll();
      const currentSurvey = surveys.find((s: any) => s.id === surveyId);
      
      if (!currentSurvey) {
        throw new Error("Không tìm thấy khảo sát");
      }
      
      // Get all survey types to find the name
      const surveyTypes = await surveyTypeApi.getAll();
      const surveyType = surveyTypes.find((t: any) => 
        t.id === currentSurvey.surveyTypeId
      );
      
      const surveyName = surveyType ? surveyType.surveyName : "Khảo sát không xác định";
      
      // Fetch complete survey data with questions
      const surveyData = await surveyApi.getById(surveyId);
      
      // Format the data
      const formattedSurvey = {
        ...surveyData,
        surveyName
      };
      
      if (!formattedSurvey.questionList || formattedSurvey.questionList.length === 0) {
        toast.error("Khảo sát này chưa có câu hỏi nào!", toastConfig);
      }
      
      setSurvey(formattedSurvey);
      loadSavedProgress(formattedSurvey);
    } catch (error) {
      console.error("Error fetching survey:", error);
      toast.error("Có lỗi xảy ra khi tải dữ liệu khảo sát!", toastConfig);
      navigate("/survey");
    } finally {
      setLoading(false);
    }
  }, [surveyId, navigate]);

  useEffect(() => {
    fetchSurveyData();
  }, [fetchSurveyData]);

  // Load saved progress or initialize default answers
  const loadSavedProgress = (surveyData: SurveyData) => {
    // First set default answers (lowest point value for each question)
    const defaultAnswers: Record<string, string> = {};

    surveyData.questionList.forEach(question => {
      if (!question.answerList || question.answerList.length === 0) {
        return;
      }

      // Find answer with lowest point value
      let lowestPointAnswer = question.answerList[0];
      for (const answer of question.answerList) {
        if (answer.point < lowestPointAnswer.point) {
          lowestPointAnswer = answer;
        }
      }
      defaultAnswers[question.id] = lowestPointAnswer.id;
    });

    // Check if there's a completed result
    try {
      const completedResult = localStorage.getItem(`survey_result_${surveyId}`);
      if (completedResult) {
        const parsedResult = JSON.parse(completedResult);
        setSelectedAnswers(parsedResult.answers || defaultAnswers);
        setScore(parsedResult.score || 0);
        setIsCompleted(true);
        return;
      }
    } catch (error) {
      console.error("Error loading completed result:", error);
    }

    // Try to load saved progress
    try {
      const savedProgress = localStorage.getItem(`survey_progress_${surveyId}`);
      if (savedProgress) {
        const { selectedAnswers: savedAnswers, currentQuestion: savedCurrentQuestion } = 
          JSON.parse(savedProgress) as StoredSurveyProgress;
        
        setSelectedAnswers(savedAnswers || defaultAnswers);
        setCurrentQuestion(savedCurrentQuestion || 0);
      } else {
        setSelectedAnswers(defaultAnswers);
      }
    } catch (error) {
      console.error("Error loading saved progress:", error);
      setSelectedAnswers(defaultAnswers);
    }
  };

  // Save progress to localStorage
  const saveProgress = () => {
    if (!surveyId) return;

    const progressData: StoredSurveyProgress = {
      selectedAnswers,
      currentQuestion
    };

    localStorage.setItem(`survey_progress_${surveyId}`, JSON.stringify(progressData));
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, answerId: string) => {
    const newSelectedAnswers = {
      ...selectedAnswers,
      [questionId]: answerId
    };

    setSelectedAnswers(newSelectedAnswers);

    // Save to localStorage whenever an answer is selected
    if (surveyId) {
      localStorage.setItem(`survey_progress_${surveyId}`, JSON.stringify({
        selectedAnswers: newSelectedAnswers,
        currentQuestion
      }));
    }
  };

  // Navigation
  const handleNext = () => {
    if (!survey) return;

    if (currentQuestion < (survey.questionList.length - 1)) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      saveProgress();
    } else {
      calculateResult();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const prevQuestion = currentQuestion - 1;
      setCurrentQuestion(prevQuestion);
      saveProgress();
    }
  };

  // Calculate result
  const calculateResult = () => {
    if (!survey) return;

    let totalScore = 0;

    // Calculate total score based on selected answers
    Object.keys(selectedAnswers).forEach(questionId => {
      const answerId = selectedAnswers[questionId];
      const question = survey.questionList.find(q => q.id === questionId);
      
      if (question) {
        const answer = question.answerList.find(a => a.id === answerId);
        if (answer) {
          totalScore += answer.point;
        }
      }
    });

    setScore(totalScore);
    setIsCompleted(true);

    // Save result to localStorage
    localStorage.setItem(`survey_result_${surveyId}`, JSON.stringify({
      score: totalScore,
      completedDate: new Date().toISOString(),
      answers: selectedAnswers
    }));

    // Send result to server
    saveResult(totalScore);
  };

  // Save result to server
  const saveResult = async (totalScore: number) => {
    if (!surveyId) return;

    try {
      await surveyResultApi.saveResult(surveyId, totalScore, selectedAnswers);
      toast.success("Kết quả khảo sát đã được lưu lại thành công!", toastConfig);
    } catch (error) {
      console.error("Error saving survey result:", error);
      toast.error("Không thể lưu kết quả khảo sát!", toastConfig);
    }
  };

  // Retake survey
  const handleRetake = () => {
    if (!survey || !surveyId) return;
    
    // Reset state
    const defaultAnswers: Record<string, string> = {};
    survey.questionList.forEach(question => {
      if (question.answerList && question.answerList.length > 0) {
        defaultAnswers[question.id] = question.answerList[0].id;
      }
    });
    
    setSelectedAnswers(defaultAnswers);
    setCurrentQuestion(0);
    setIsCompleted(false);
    setScore(0);

    // Clear saved result from localStorage
    localStorage.removeItem(`survey_result_${surveyId}`);
  };

  // Return to survey list
  const handleBackToList = () => {
    navigate("/survey");
  };

  if (loading) {
    return <div className="loading-container">Đang tải khảo sát...</div>;
  }

  if (!survey) {
    return (
      <div className="error-container">
        <h2>Không thể tải khảo sát</h2>
        <button onClick={handleBackToList}>Quay lại danh sách</button>
      </div>
    );
  }

  // Results screen
  if (isCompleted) {
    return (
      <div className="survey-result-container">
        <ToastContainer position="top-center" autoClose={3000} />
        
        <h1>{survey.surveyName} - Kết quả</h1>
        <div className="result-card">
          <div className="score-display">
            <h2>Điểm của bạn</h2>
            <div className="score">{score} / {survey.maxScore}</div>
            
            <div className="score-percentage">
              {Math.round((score / survey.maxScore) * 100)}%
            </div>
          </div>
          
          <div className="result-actions">
            <button className="retake-button" onClick={handleRetake}>
              Làm lại khảo sát
            </button>
            <button className="back-button" onClick={handleBackToList}>
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safety check for current question data
  if (!survey.questionList || currentQuestion >= survey.questionList.length) {
    return (
      <div className="error-container">
        <h2>Lỗi dữ liệu khảo sát</h2>
        <button onClick={handleBackToList}>Quay lại danh sách</button>
      </div>
    );
  }

  // Survey taking screen
  const currentQuestionData = survey.questionList[currentQuestion];
  return (
    <div className="take-survey-container">
      <ToastContainer position="top-center" autoClose={3000} />

      <div className="survey-header">
        <h1>{survey.surveyName}</h1>
        <div className="progress-indicator">
          Câu hỏi {currentQuestion + 1} / {survey.questionList.length}
        </div>
      </div>

      <div className="question-container">
        <div className="question">
          <h2>{currentQuestionData.contentQ}</h2>
        </div>

        <div className="answers-list">
          {currentQuestionData.answerList.map((answer) => (
            <label key={answer.id} className="answer-option">
              <input
                type="radio"
                name={`question_${currentQuestionData.id}`}
                checked={selectedAnswers[currentQuestionData.id] === answer.id}
                onChange={() => handleAnswerSelect(currentQuestionData.id, answer.id)}
              />
              <span className="answer-text">{answer.content}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="navigation-buttons">
        <button 
          className="prev-button" 
          onClick={handlePrevious} 
          disabled={currentQuestion === 0}
        >
          Câu trước
        </button>
        
        <button className="next-button" onClick={handleNext}>
          {currentQuestion < survey.questionList.length - 1 ? "Câu tiếp theo" : "Hoàn thành"}
        </button>
      </div>
    </div>
  );
};

export default TakeSurvey;