import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { surveyApi, questionApi, answerApi } from "../../services/SurveyApiService";
import { toastConfig } from "../../types/toastConfig";
import "react-toastify/dist/ReactToastify.css";
import "./SurveyEdit.scss";

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

const SurveyEdit: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  
  // Data state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Question editing state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestionText, setEditQuestionText] = useState<string>("");
  const [newQuestion, setNewQuestion] = useState<string>("");
  
  // Answer editing state
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editingAnswerQuestionId, setEditingAnswerQuestionId] = useState<string | null>(null);
  const [editAnswerText, setEditAnswerText] = useState<string>("");
  const [editAnswerPoint, setEditAnswerPoint] = useState<number>(0);
  
  // New answer state
  const [newAnswerContent, setNewAnswerContent] = useState<string>("");
  const [newAnswerPoint, setNewAnswerPoint] = useState<number>(0);
  const [addingAnswerToQuestionId, setAddingAnswerToQuestionId] = useState<string | null>(null);

  // Fetch questions data
  const fetchQuestions = useCallback(async () => {
    if (!surveyId) {
      toast.error("Không tìm thấy surveyId!", toastConfig);
      navigate("/manage");
      return;
    }

    try {
      setLoading(true);
      const data = await surveyApi.getById(surveyId);
      
      if (!data.questionList) {
        setQuestions([]);
        return;
      }
      
      // Filter active questions and answers
      const activeQuestions = data.questionList
        .filter((q: any) => q.isDelete === false)
        .map((q: any) => ({
          ...q,
          answerList: (q.answerList || []).filter((a: any) => a.isDelete === false)
        }));
      
      setQuestions(activeQuestions);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  }, [surveyId, navigate]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Question operations
  const handleAddQuestion = async () => {
    if (!surveyId || !newQuestion.trim()) {
      toast.error("Vui lòng nhập nội dung câu hỏi", toastConfig);
      return;
    }

    try {
      await questionApi.create(surveyId, newQuestion);
      toast.success("Thêm câu hỏi thành công", toastConfig);
      setNewQuestion("");
      fetchQuestions();
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  const startEditQuestion = (question: Question) => {
    setEditingQuestionId(question.id);
    setEditQuestionText(question.contentQ);
  };

  const cancelEditQuestion = () => {
    setEditingQuestionId(null);
    setEditQuestionText("");
  };

  const handleUpdateQuestion = async (questionId: string) => {
    if (!editQuestionText.trim()) {
      toast.error("Vui lòng nhập nội dung câu hỏi", toastConfig);
      return;
    }

    try {
      await questionApi.update(questionId, editQuestionText);
      toast.success("Cập nhật câu hỏi thành công", toastConfig);
      cancelEditQuestion();
      fetchQuestions();
    } catch (error) {
      console.error("Error updating question:", error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) {
      try {
        await questionApi.delete(questionId);
        toast.success("Xóa câu hỏi thành công", toastConfig);
        fetchQuestions();
      } catch (error) {
        console.error("Error deleting question:", error);
      }
    }
  };

  // Answer operations
  const startAddAnswer = (questionId: string) => {
    setAddingAnswerToQuestionId(questionId);
    setNewAnswerContent("");
    setNewAnswerPoint(0);
  };

  const cancelAddAnswer = () => {
    setAddingAnswerToQuestionId(null);
    setNewAnswerContent("");
    setNewAnswerPoint(0);
  };

  const handleAddAnswer = async (questionId: string) => {
    if (!newAnswerContent.trim()) {
      toast.error("Vui lòng nhập nội dung câu trả lời", toastConfig);
      return;
    }

    try {
      await answerApi.create(questionId, newAnswerContent, newAnswerPoint);
      toast.success("Thêm câu trả lời thành công", toastConfig);
      cancelAddAnswer();
      fetchQuestions();
    } catch (error) {
      console.error("Error adding answer:", error);
    }
  };

  const startEditAnswer = (answer: Answer, questionId: string) => {
    setEditingAnswerQuestionId(questionId);
    setEditingAnswerId(answer.id);
    setEditAnswerText(answer.content);
    setEditAnswerPoint(answer.point);
  };

  const cancelEditAnswer = () => {
    setEditingAnswerQuestionId(null);
    setEditingAnswerId(null);
    setEditAnswerText("");
    setEditAnswerPoint(0);
  };

  const handleUpdateAnswer = async (questionId: string, answerId: string) => {
    if (!editAnswerText.trim()) {
      toast.error("Vui lòng nhập nội dung câu trả lời", toastConfig);
      return;
    }

    try {
      await answerApi.update(answerId, editAnswerText, editAnswerPoint);
      toast.success("Cập nhật câu trả lời thành công", toastConfig);
      cancelEditAnswer();
      fetchQuestions();
    } catch (error) {
      console.error("Error updating answer:", error);
    }
  };

  const handleDeleteAnswer = async (questionId: string, answerId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa câu trả lời này?")) {
      try {
        await answerApi.delete(answerId);
        toast.success("Xóa câu trả lời thành công", toastConfig);
        fetchQuestions();
      } catch (error) {
        console.error("Error deleting answer:", error);
      }
    }
  };

  if (loading) {
    return <div className="loading-container">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="survey-questions-container">
      <ToastContainer position="top-center" autoClose={3000} />
      
      <div className="survey-header">
        <h1>Chỉnh Sửa Bài Khảo Sát</h1>
        <button className="back-button" onClick={() => navigate("/manage")}>
          Quay lại
        </button>
      </div>

      {/* Add new question form */}
      <div className="add-question-form">
        <h2>Thêm Câu Hỏi Mới</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="Nhập nội dung câu hỏi..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />
          <button onClick={handleAddQuestion}>Thêm</button>
        </div>
      </div>

      {/* Questions list */}
      <div className="questions-list">
        <h2>Danh Sách Câu Hỏi</h2>
        {questions.length === 0 ? (
          <div className="empty-state">Chưa có câu hỏi nào</div>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="question-card">
              {/* Question content */}
              <div className="question-content">
                {editingQuestionId === question.id ? (
                  <div className="edit-question-form">
                    <input
                      type="text"
                      value={editQuestionText}
                      onChange={(e) => setEditQuestionText(e.target.value)}
                    />
                    <div className="button-group">
                      <button onClick={() => handleUpdateQuestion(question.id)}>Lưu</button>
                      <button onClick={cancelEditQuestion}>Hủy</button>
                    </div>
                  </div>
                ) : (
                  <div className="question-display">
                    <h3>{question.contentQ}</h3>
                    <div className="question-actions">
                      <button onClick={() => startEditQuestion(question)}>Sửa</button>
                      <button onClick={() => handleDeleteQuestion(question.id)}>Xóa</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Answers list */}
              <div className="answers-list">
                <h4>Câu trả lời</h4>
                {question.answerList.length === 0 ? (
                  <div className="empty-state">Chưa có câu trả lời nào</div>
                ) : (
                  <ul>
                    {question.answerList.map((answer) => (
                      <li key={answer.id} className="answer-item">
                        {editingAnswerId === answer.id ? (
                          <div className="edit-answer-form">
                            <input
                              type="text"
                              value={editAnswerText}
                              onChange={(e) => setEditAnswerText(e.target.value)}
                              placeholder="Nội dung câu trả lời"
                            />
                            <input
                              type="number"
                              value={editAnswerPoint}
                              onChange={(e) => setEditAnswerPoint(Number(e.target.value))}
                              placeholder="Điểm"
                            />
                            <div className="button-group">
                              <button onClick={() => handleUpdateAnswer(question.id, answer.id)}>Lưu</button>
                              <button onClick={cancelEditAnswer}>Hủy</button>
                            </div>
                          </div>
                        ) : (
                          <div className="answer-display">
                            <span className="answer-content">{answer.content}</span>
                            <span className="answer-point">Điểm: {answer.point}</span>
                            <div className="answer-actions">
                              <button onClick={() => startEditAnswer(answer, question.id)}>Sửa</button>
                              <button onClick={() => handleDeleteAnswer(question.id, answer.id)}>Xóa</button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Add answer form */}
                {addingAnswerToQuestionId === question.id ? (
                  <div className="add-answer-form">
                    <input
                      type="text"
                      value={newAnswerContent}
                      onChange={(e) => setNewAnswerContent(e.target.value)}
                      placeholder="Nội dung câu trả lời"
                    />
                    <input
                      type="number"
                      value={newAnswerPoint}
                      onChange={(e) => setNewAnswerPoint(Number(e.target.value))}
                      placeholder="Điểm"
                    />
                    <div className="button-group">
                      <button onClick={() => handleAddAnswer(question.id)}>Thêm</button>
                      <button onClick={cancelAddAnswer}>Hủy</button>
                    </div>
                  </div>
                ) : (
                  <button className="add-answer-button" onClick={() => startAddAnswer(question.id)}>
                    + Thêm câu trả lời
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SurveyEdit;