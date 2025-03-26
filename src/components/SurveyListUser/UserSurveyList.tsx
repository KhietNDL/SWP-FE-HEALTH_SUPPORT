import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { FiSearch, FiClipboard, FiRefreshCw } from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";
import { surveyApi, surveyTypeApi } from "../../services/SurveyApiService";
import { Survey } from "../../types/Survey";
import { SurveyType } from "../../types/SurveyType";
import { toastConfig } from "../../types/toastConfig";
import "./UserSurveyList.scss";

interface MergedSurvey extends Survey {
  surveyName: string;
}

const UserSurveyList = () => {
  const [surveys, setSurveys] = useState<MergedSurvey[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchActiveSurveys = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch data in parallel for better performance
      const [surveysResponse, typesResponse] = await Promise.all([
        surveyApi.getAll(),
        surveyTypeApi.getAll()
      ]);
      
      // Filter active surveys
      const activeSurveys = surveysResponse.filter((survey: Survey) => !survey.isDeleted);
      const surveyTypes = typesResponse;
      
      // Merge survey data with type names
      const mergedSurveys = activeSurveys.map((survey: Survey) => {
        const surveyType = surveyTypes.find((type: SurveyType) => 
          String(type.id) === String(survey.surveyTypeId)
        );
        
        return {
          ...survey,
          surveyName: surveyType ? surveyType.surveyName : "Không xác định"
        };
      });
      
      setSurveys(mergedSurveys);
      //toast.success("Đã tải danh sách khảo sát thành công", toastConfig);
    } catch (error) {
      console.error("Error fetching surveys:", error);
      toast.error("Không thể tải danh sách khảo sát. Vui lòng thử lại sau.", toastConfig);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveSurveys();
  }, [fetchActiveSurveys]);

  const startSurvey = (survey: MergedSurvey) => {
    if (survey && survey.id) {
      navigate(`/take-survey/${survey.id}`);
    } else {
      toast.error("Không thể bắt đầu khảo sát. ID khảo sát không tồn tại.", toastConfig);
    }
  };

  const filteredSurveys = surveys.filter((survey) =>
    survey.surveyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="user-survey-list">
      <ToastContainer />
      
      <div className="survey-header">
        <h1>Danh Sách Khảo Sát</h1>
        <div className="controls">
          {/* <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm khảo sát..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchActiveSurveys} 
            className="refresh-button"
            disabled={isLoading}
          >
            <FiRefreshCw className={isLoading ? "spinning" : ""} />
            Làm mới
          </button> */}
        </div>
      </div>
      
      <div className="survey-list">
        {isLoading ? (
          <div className="loading-message">Đang tải danh sách khảo sát...</div>
        ) : filteredSurveys.length === 0 ? (
          <div className="empty-message">
            <FiClipboard className="empty-icon" />
            <p>Không có khảo sát nào hiện tại</p>
          </div>
        ) : (
          <div className="survey-grid">
            {filteredSurveys.map((survey) => (
              <div className="survey-card" key={survey.id}>
                <div className="survey-info">
                  <h3>{survey.surveyName}</h3>
                  <p>Điểm tối đa: {survey.maxScore}</p>
                </div>
                <button
                  className="start-button"
                  onClick={() => startSurvey(survey)}
                >
                  Làm bài
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSurveyList;