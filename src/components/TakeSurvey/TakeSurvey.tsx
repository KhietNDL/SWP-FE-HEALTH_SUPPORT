import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./TakeSurvey.scss";

interface Answer {
  id: string;
  content: string;
  point: number;
}

interface Question {
  id: string;
  contentQ: string;
  answerList: Answer[];
}

interface SurveyType {
  id: string;
  surveyName: string;
  isDelete: boolean;
}

interface Survey {
  id: string;
  surveyTypeId: string;
  surveyName: string;
  maxScore: number;
  questionList: Question[];
  isDeleted: boolean;
}
interface SurveyData {
  id: string;
  surveyTypeId?: string;
  surveyName: string;
  maxScore: number;
  questionList: Question[];
  title?: string;
  name?: string;
}
interface StoredSurveyProgress {
  selectedAnswers: Record<string, string>;
  currentQuestion: number;
}

const TakeSurvey = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  // Load saved progress from localStorage when component mounts
  useEffect(() => {
    console.log("TakeSurvey mounted with surveyId:", surveyId);
    if (!surveyId) {
      console.error("No surveyId provided in URL");
      toast.error("Không tìm thấy mã khảo sát!");
      navigate("/survey");
      return;
    }

    fetchSurveyData();
  }, [surveyId, navigate]);

  const fetchSurveyData = async () => {
    try {
      setLoading(true);
      console.log("Fetching survey data for ID:", surveyId);
  
      if (!surveyId) {
        throw new Error("Survey ID is required");
      }
  
      const getAllSurvey = await axios.get("http://localhost:5199/Survey");
      const Survey: Survey[] = getAllSurvey.data
      console.log("Survey loaded:", Survey);
  
      // Fetching all survey types first
      const surveyTypesResponse = await axios.get("http://localhost:5199/SurveyType");
      const surveyTypes: SurveyType[] = surveyTypesResponse.data;
      console.log("Survey types loaded:", surveyTypes);
  
      //Choose the surveyName which its surveyTypeId fit with surveyId in the params
      const currentSurvey = Survey.find(survey => survey.id === surveyId);
      
      // Tạo biến để lưu tên khảo sát
      let surveyName = "Không có tên survey";
  
      if (currentSurvey) {
        // Find the matching survey type using the surveyTypeId from the current survey
        const matchingSurveyType = surveyTypes.find(
          type => type.id === currentSurvey.surveyTypeId
        );
  
        // Gán tên khảo sát từ currentSurvey hoặc matchingSurveyType
        surveyName = currentSurvey.surveyName || 
                    (matchingSurveyType ? matchingSurveyType.surveyName : "Không có tên survey");
        
        console.log("Current survey name:", surveyName);
      }
  
      // Lấy thông tin khảo sát
      const url = `http://localhost:5199/Survey/${surveyId}`;
      console.log("Making API call to:", url);
      const surveyResponse = await axios.get(url);
      console.log("Survey response data:", surveyResponse.data);
  
      if (!surveyResponse.data) {
        throw new Error("No survey data received");
      }
  
      const surveyData = {
        ...surveyResponse.data,
        surveyName: surveyName  // Sử dụng surveyName đã được xác định ở trên
      };
  
      if (!surveyData.questionList || surveyData.questionList.length === 0) {
        toast.error("Khảo sát này chưa có câu hỏi!");
        navigate("/survey");
        return;
      }
  
      setSurvey(surveyData);
      loadSavedProgress(surveyData);
    } catch (error) {
      console.error("Error fetching survey:", error);
      toast.error("Có lỗi xảy ra khi tải dữ liệu khảo sát!");
    } finally {
      setLoading(false);
    }
  };

  // Initialize default answers and load saved progress
  const loadSavedProgress = (surveyData: SurveyData) => {
    // First set default answers (lowest point value for each question)
    const defaultAnswers: Record<string, string> = {};

    surveyData.questionList.forEach(question => {
      // Find answer with lowest point value
      if (!question.answerList || question.answerList.length === 0) {
        console.warn(`Question ${question.id} has no answers`);
        return;
      }

      let lowestPointAnswer = question.answerList[0];

      for (const answer of question.answerList) {
        if (answer.point < lowestPointAnswer.point) {
          lowestPointAnswer = answer;
        }
      }

      defaultAnswers[question.id] = lowestPointAnswer.id;
    });

    // Then try to load saved progress from localStorage
    try {
      const savedProgressJson = localStorage.getItem(`survey_progress_${surveyId}`);
      if (savedProgressJson) {
        const savedProgress: StoredSurveyProgress = JSON.parse(savedProgressJson);

        // Merge saved answers with default answers (for any new questions)
        const mergedAnswers = { ...defaultAnswers, ...savedProgress.selectedAnswers };

        setSelectedAnswers(mergedAnswers);

        // Ensure currentQuestion is within bounds
        const safeCurrentQuestion = Math.min(
          savedProgress.currentQuestion,
          surveyData.questionList.length - 1
        );
        setCurrentQuestion(safeCurrentQuestion);

        console.log("Loaded saved progress:", savedProgress);
      } else {
        // If no saved progress, just use the default answers
        setSelectedAnswers(defaultAnswers);
      }
    } catch (error) {
      console.error("Error loading saved progress:", error);
      // Fallback to default answers
      setSelectedAnswers(defaultAnswers);
    }

    // Check if there's a completed result
    try {
      const savedResultJson = localStorage.getItem(`survey_result_${surveyId}`);
      if (savedResultJson) {
        const savedResult = JSON.parse(savedResultJson);
        setScore(savedResult.score);
        setIsCompleted(true);
        console.log("Loaded saved result:", savedResult);
      }
    } catch (error) {
      console.error("Error loading saved result:", error);
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
    console.log("Saved progress to localStorage");
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    const newSelectedAnswers = {
      ...selectedAnswers,
      [questionId]: answerId
    };

    setSelectedAnswers(newSelectedAnswers);

    // Save to localStorage whenever an answer is selected
    localStorage.setItem(`survey_progress_${surveyId}`, JSON.stringify({
      selectedAnswers: newSelectedAnswers,
      currentQuestion
    }));
  };

  const handleNext = () => {
    if (!survey) return;

    if (currentQuestion < (survey.questionList.length - 1)) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);

      // Save progress
      saveProgress();
    } else {
      calculateResult();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);

      // Save progress
      saveProgress();
    }
  };

  const calculateResult = () => {
    if (!survey) return;

    let totalScore = 0;

    // Tính điểm dựa trên câu trả lời đã chọn
    Object.keys(selectedAnswers).forEach(questionId => {
      const answerId = selectedAnswers[questionId];
      const question = survey.questionList.find(q => q.id === questionId);
      const answer = question?.answerList.find(a => a.id === answerId);

      if (answer) {
        totalScore += answer.point;
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

    // Có thể gửi kết quả lên server ở đây
    saveResult(totalScore);
  };

  const saveResult = async (totalScore: number) => {
    if (!surveyId) return;

    try {
      // Giả định API lưu kết quả (có thể điều chỉnh theo API thực tế)
      await axios.post('http://localhost:5199/api/SurveyAnswerRecord', {
        surveyId: surveyId,
        userId: "user-id", // Có thể lấy từ đăng nhập
        score: totalScore,
        completedDate: new Date().toISOString(),
        answers: Object.keys(selectedAnswers).map(questionId => ({
          questionId,
          answerId: selectedAnswers[questionId]
        }))
      });
      console.log("Survey result saved successfully");
    } catch (error) {
      console.error("Error saving result:", error);
      toast.error("Có lỗi xảy ra khi lưu kết quả!");
    }
  };

  const handleRetake = () => {
    // Reset state
    if (survey) {
      loadSavedProgress(survey); // This will reload the default answers
    }

    setCurrentQuestion(0);
    setIsCompleted(false);
    setScore(0);

    // Clear saved result from localStorage
    localStorage.removeItem(`survey_result_${surveyId}`);
  };

  const handleBackToList = () => {
    navigate("/survey");
  };

  if (loading) {
    return <div className="loading-container">
      <div className="loader"></div>
      <p>Đang tải khảo sát...</p>
    </div>;
  }

  if (!survey) {
    return <div className="error-container">
      <h2>Không tìm thấy khảo sát</h2>
      <button onClick={handleBackToList} className="btn-primary">Quay lại danh sách</button>
    </div>;
  }

  if (isCompleted) {
    return (
      <div className="take-survey-container">
        <div className="result-container">
          <h1>Kết quả khảo sát</h1>
          <h2>{survey.surveyName}</h2>

          <div className="score-display">
            <div className="score-circle">
              <span className="score-value">{score}</span>
              <span className="score-max">/{survey.maxScore}</span>
            </div>
          </div>

          <div className="score-message">
            {score >= survey.maxScore * 0.8 && (
              <p>Xuất sắc! Bạn đã hoàn thành bài khảo sát với kết quả rất cao.</p>
            )}
            {score >= survey.maxScore * 0.6 && score < survey.maxScore * 0.8 && (
              <p>Tốt! Bạn đã hoàn thành bài khảo sát với kết quả khá.</p>
            )}
            {score < survey.maxScore * 0.6 && (
              <p>Cảm ơn bạn đã hoàn thành bài khảo sát.</p>
            )}
          </div>

          <div className="result-actions">
            <button onClick={handleRetake} className="btn-secondary">Làm lại</button>
            <button onClick={handleBackToList} className="btn-primary">Quay lại danh sách</button>
          </div>
        </div>
      </div>
    );
  }

  // Safety check for current question data
  if (!survey.questionList || currentQuestion >= survey.questionList.length) {
    return <div className="error-container">
      <h2>Có lỗi với dữ liệu câu hỏi</h2>
      <button onClick={handleBackToList} className="btn-primary">Quay lại danh sách</button>
    </div>;
  }

  const currentQuestionData = survey.questionList[currentQuestion];

  return (
    <div className="take-survey-container">
      <ToastContainer position="top-center" autoClose={3000} />

      <div className="survey-header">
        <h1>{survey.surveyName}</h1>
        <div className="progress-container">
          <div className="progress-text">
            Câu hỏi {currentQuestion + 1}/{survey.questionList.length}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestion + 1) / survey.questionList.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="question-container">
        <h2 className="question-text">{currentQuestionData.contentQ}</h2>

        <div className="answers-container">
          {currentQuestionData.answerList.map((answer) => (
            <div
              key={answer.id}
              className={`answer-option ${selectedAnswers[currentQuestionData.id] === answer.id ? 'selected' : ''}`}
              onClick={() => handleAnswerSelect(currentQuestionData.id, answer.id)}
            >
              <div className="answer-radio">
                <div className="radio-inner"></div>
              </div>
              <div className="answer-text">{answer.content}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="survey-navigation">
        <button
          onClick={handlePrevious}
          className="btn-secondary"
          disabled={currentQuestion === 0}
        >
          Câu trước
        </button>

        <button
          onClick={handleNext}
          className="btn-primary"
        >
          {currentQuestion === survey.questionList.length - 1 ? 'Hoàn thành' : 'Câu tiếp theo'}
        </button>
      </div>
    </div>
  );
};

export default TakeSurvey;