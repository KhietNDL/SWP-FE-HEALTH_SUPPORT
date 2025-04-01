import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { surveyApi, surveyTypeApi, AccountSurveyApi, SurveyAnswerRecordApi } from "../../services/SurveyApiService";
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

const userInfoStr = localStorage.getItem("userInfo");
const accountId = userInfoStr ? JSON.parse(userInfoStr).id : undefined;

const TakeSurvey: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [accountSurveyId, setAccountSurveyId] = useState<string | null>(null);
  const [isSurveyCompleted, setIsSurveyCompleted] = useState<boolean>(false); // Cờ kiểm tra trạng thái hoàn thành

  const newAccountSurvey = async () => {
    if (accountId && surveyId) {
      try {
        const createdSurvey = await AccountSurveyApi.postAccountSurvey(accountId, surveyId);
        const allAccountSurveys = await AccountSurveyApi.getAccountSurveyByAccountId(accountId);

        const latestSurvey = allAccountSurveys.reduce((latest: { createAt: string | number | Date; }, current: { createAt: string | number | Date; }) => {
          return !latest || new Date(current.createAt) > new Date(latest.createAt) ? current : latest;
        }, null);

        if (latestSurvey) {
          setAccountSurveyId(latestSurvey.id);
        }
      } catch (error) {
        console.error("Error posting account survey:", error);
      }
    } else {
      console.error("Invalid accountId or surveyId:", { accountId, surveyId });
    }
  };

  const deleteAccountSurvey = async () => {
    if (accountSurveyId) {
      try {
        await AccountSurveyApi.delete(accountSurveyId);
        console.log("AccountSurvey deleted successfully");
      } catch (error) {
        console.error("Error deleting account survey:", error);
      }
    }
  };

  const fetchSurveyData = useCallback(async () => {
    if (!surveyId) {
      toast.error("Không tìm thấy mã khảo sát!", toastConfig);
      navigate("/survey");
      return;
    }

    setLoading(true);
    try {
      const surveys = await surveyApi.getAll();
      const currentSurvey = surveys.find((s: any) => s.id === surveyId);

      if (!currentSurvey) {
        throw new Error("Không tìm thấy khảo sát");
      }

      const surveyTypes = await surveyTypeApi.getAll();
      const surveyType = surveyTypes.find((t: any) => t.id === currentSurvey.surveyTypeId);

      const surveyName = surveyType ? surveyType.surveyName : "Khảo sát không xác định";

      const surveyData = await surveyApi.getById(surveyId);

      const formattedSurvey = {
        ...surveyData,
        surveyName,
      };

      if (!formattedSurvey.questionList || formattedSurvey.questionList.length === 0) {
        toast.error("Khảo sát này chưa có câu hỏi nào!", toastConfig);
      }

      setSurvey(formattedSurvey);
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
    newAccountSurvey();

    // Cleanup logic: Xóa AccountSurvey nếu người dùng rời khỏi trang và chưa hoàn thành khảo sát
    return () => {
      if (!isSurveyCompleted) {
        deleteAccountSurvey();
      }
    };
  }, [fetchSurveyData, isSurveyCompleted]);

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    const newSelectedAnswers = {
      ...selectedAnswers,
      [questionId]: answerId,
    };

    setSelectedAnswers(newSelectedAnswers);
  };

  const handleNext = () => {
    if (!survey) return;

    if (currentQuestion < survey.questionList.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
    } else {
      submitSurvey();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const prevQuestion = currentQuestion - 1;
      setCurrentQuestion(prevQuestion);
    }
  };

  const submitSurvey = async () => {
    if (!survey || !accountSurveyId) return;

    // Chuẩn bị dữ liệu để gửi lên API
    const questionAndAnswerRequests = Object.keys(selectedAnswers).map((questionId) => ({
      surveyQuestionId: questionId,
      surveyAnswerId: selectedAnswers[questionId],
    }));

    try {
      // Gửi kết quả khảo sát lên server
      await SurveyAnswerRecordApi.postSurveyAnswerRecord(accountSurveyId, questionAndAnswerRequests);
      console.log("SurveyAnswerRecord posted successfully");

      // Đặt cờ hoàn thành khảo sát
      setIsSurveyCompleted(true);

      // Điều hướng đến trang kết quả khảo sát
      navigate(`/survey-result/${accountSurveyId}`);
    } catch (error) {
      console.error("Error posting survey answer record:", error);
      toast.error("Có lỗi xảy ra khi lưu kết quả khảo sát!", toastConfig);
    }
  };

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
          {currentQuestionData.answerList.map((answer) => {
            // Tìm câu trả lời có point nhỏ nhất
            const minPointAnswer = currentQuestionData.answerList.reduce((min, current) =>
              current.point < min.point ? current : min
            );

            // Nếu chưa có câu trả lời nào được chọn, đặt câu trả lời mặc định là câu trả lời có point nhỏ nhất
            if (!selectedAnswers[currentQuestionData.id] && minPointAnswer.id === answer.id) {
              setSelectedAnswers((prev) => ({
                ...prev,
                [currentQuestionData.id]: minPointAnswer.id,
              }));
            }

            return (
              <label key={answer.id} className="answer-option">
                <input
                  type="radio"
                  name={`question_${currentQuestionData.id}`}
                  checked={selectedAnswers[currentQuestionData.id] === answer.id}
                  onChange={() => handleAnswerSelect(currentQuestionData.id, answer.id)}
                />
                <span className="answer-text">{answer.content}</span>
              </label>
            );
          })}
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