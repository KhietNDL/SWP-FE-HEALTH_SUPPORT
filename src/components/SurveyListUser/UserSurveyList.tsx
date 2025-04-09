"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ToastContainer, toast } from "react-toastify"
import { FiSearch, FiClipboard, FiRefreshCw, FiAward, FiCheckCircle } from "react-icons/fi"
import "react-toastify/dist/ReactToastify.css"
import { surveyApi, surveyTypeApi } from "../../services/SurveyApiService"
import type { Survey } from "../../types/Survey"
import type { SurveyType } from "../../types/SurveyType"
import { toastConfig } from "../../types/toastConfig"
import "./UserSurveyList.scss"

interface MergedSurvey extends Survey {
  surveyName: string
}

const UserSurveyList = () => {
  const [surveys, setSurveys] = useState<MergedSurvey[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const fetchActiveSurveys = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch data in parallel for better performance
      const [surveysResponse, typesResponse] = await Promise.all([surveyApi.getAll(), surveyTypeApi.getAll()])

      // Filter active surveys
      const activeSurveys = surveysResponse.filter((survey: Survey) => !survey.isDeleted)
      const surveyTypes = typesResponse

      // Merge survey data with type names
      const mergedSurveys = activeSurveys.map((survey: Survey) => {
        const surveyType = surveyTypes.find((type: SurveyType) => String(type.id) === String(survey.surveyTypeId))

        return {
          ...survey,
          surveyName: surveyType ? surveyType.surveyName : "Không xác định",
        }
      })

      setSurveys(mergedSurveys)
    } catch (error) {
      console.error("Error fetching surveys:", error)
      toast.error("Không thể tải danh sách khảo sát. Vui lòng thử lại sau.", toastConfig)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActiveSurveys()
  }, [fetchActiveSurveys])

  const startSurvey = (survey: MergedSurvey) => {
    const isAuthenticated = localStorage.getItem("BearerToken") || sessionStorage.getItem("token")

    if (!isAuthenticated) {
      toast.warning("Vui lòng đăng nhập để thực hiện khảo sát!", toastConfig)
      setTimeout(() => {
        navigate("/login")
      }, 1500)
      return
    }

    if (survey && survey.id) {
      navigate(`/take-survey/${survey.id}`)
    } else {
      toast.error("Không thể bắt đầu khảo sát. ID khảo sát không tồn tại.", toastConfig)
    }
  }

  const filteredSurveys = surveys.filter((survey) => survey.surveyName.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="user-survey-list">
      <ToastContainer />

      <div className="survey-header">
        <h1>Danh Sách Khảo Sát</h1>
        {/* <div className="controls">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm khảo sát..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchActiveSurveys} className="refresh-button" disabled={isLoading}>
            <FiRefreshCw className={isLoading ? "spinning" : ""} />
            Làm mới
          </button>
        </div> */}
      </div>

      <div className="survey-list">
        {isLoading ? (
          <div className="loading-message">
            <div className="loader"></div>
            <p>Đang tải danh sách khảo sát...</p>
          </div>
        ) : filteredSurveys.length === 0 ? (
          <div className="empty-message">
            <FiClipboard className="empty-icon" />
            <p>Không có khảo sát nào hiện tại</p>
            <button onClick={fetchActiveSurveys} className="retry-button">
              Thử lại
            </button>
          </div>
        ) : (
          <div className="survey-grid">
            {filteredSurveys.map((survey) => (
              <div className="survey-card" key={survey.id}>
                <div className="survey-info">
                  <div className="survey-icon">
                    <FiAward />
                  </div>
                  <h3>{survey.surveyName}</h3>
                  <div className="survey-details">
                    <div className="detail-item">
                      <FiCheckCircle className="detail-icon" />
                      <p>
                        Điểm tối đa: <span>{survey.maxScore}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <button className="start-button" onClick={() => startSurvey(survey)}>
                  Làm bài
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserSurveyList
