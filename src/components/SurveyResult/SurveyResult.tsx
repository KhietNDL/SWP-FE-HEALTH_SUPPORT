import React, { useState, useEffect } from "react";
import Header from "../Header/index";
import Footer from "../Footer/index";
import { useParams } from "react-router-dom";
import { accountApi, surveyApi, surveyTypeApi, AccountSurveyApi, SurveyAnswerRecordApi, SurveyResultApi } from "../../services/SurveyApiService";
import { FaArrowRight } from "react-icons/fa";
import "./SurveyResult.scss";

const userInfoStr = localStorage.getItem("userInfo");
const userInfo = userInfoStr ? JSON.parse(userInfoStr) : {};

// Get the accountId from localStorage
const accountId = userInfo.id || "";

// Fetch account data using the accountId
const fetchAccountData = async () => {
  try {
    if (!accountId) {
      console.error("Account ID is undefined");
      return null;
    }
    const account = await accountApi.getById(accountId);
    return account;
  } catch (error) {
    console.error("Error fetching account data:", error);
    return null;
  }
};
fetchAccountData();

// Fetch account survey data using the accountSurveyId
const fetchAccountSurvey = async (accountSurveyId: string) => {
  try {
    if (!accountSurveyId) {
      console.error("Account Survey ID is undefined");
      return null;
    }
    const accountSurvey = await AccountSurveyApi.getAccountSurveyByAccountSurveyId(accountSurveyId);
    console.log("Fetched account survey:", accountSurvey);
    console.log("Survey ID:", accountSurvey.surveyId);
    return accountSurvey;
  } catch (error) {
    console.error("Error fetching account survey:", error);
    return null;
  }
};

// Fetch account survey data using the accountSurveyId
const fetchAccountSurveyData = async (accountSurveyId: string | undefined) => {
  try {
    if (!accountSurveyId) {
      console.error("accountSurveyId is undefined");
      return null;
    }
    const accountSurveyData = await SurveyAnswerRecordApi.getSurveyAnswerRecordByAccountSurveyId(accountSurveyId);
    // Filter the data based on accountSurveyId
    const filteredAccountSurveyData = accountSurveyData.filter((item: any) => item.accountSurveyId === accountSurveyId);
    console.log("Filtered account survey data:", filteredAccountSurveyData);
    return filteredAccountSurveyData;
  } catch (error) {
    console.error("Error fetching account survey data:", error);
    return null;
  }
};

// Function to fetch survey name based on surveyId
const fetchSurveyName = async (surveyId: string) => {
  try {
    if (!surveyId) {
      console.error("Survey ID is undefined");
      return null;
    }
    
    // Get all surveys and find the matching one
    const allSurveys = await surveyApi.getAll();
    const matchingSurvey = allSurveys.find((survey: any) => survey.id === surveyId);
    
    if (!matchingSurvey) {
      console.error("No matching survey found for ID:", surveyId);
      return null;
    }
    console.log("Found matching survey:", matchingSurvey);
    
    // Get the surveyTypeId from the matching survey
    const surveyTypeId = matchingSurvey.surveyTypeId;
    
    if (!surveyTypeId) {
      console.error("Survey Type ID is undefined");
      return null;
    }
    
    // Get all survey types and find the matching one
    const allSurveyTypes = await surveyTypeApi.getAll();
    const matchingSurveyType = allSurveyTypes.find((type: any) => type.id === surveyTypeId);
    
    if (!matchingSurveyType) {
      console.error("No matching survey type found for ID:", surveyTypeId);
      return null;
    }
    console.log("Found matching survey type:", matchingSurveyType);
    
    // Return the survey name
    return matchingSurveyType.surveyName;
  } catch (error) {
    console.error("Error fetching survey name:", error);
    return null;
  }
};

const fetchFilteredSurveyResults = async (surveyId: string) => {
  try {
    if (!surveyId) {
      console.error("Survey ID is undefined");
      return [];
    }

    // Fetch all survey results
    const allSurveyResults = await SurveyResultApi.getAll();

    // Filter survey results by matching surveyId
    const filteredResults = allSurveyResults.filter(
      (result: any) => result.surveyId === surveyId
    );

    console.log("Filtered Survey Results:", filteredResults);
    return filteredResults;
  } catch (error) {
    console.error("Error fetching filtered survey results:", error);
    return [];
  }
};

const assignLevelsToFilteredResults = (filteredResults: any[]) => {
  // Sắp xếp theo minScore tăng dần
  const sortedResults = [...filteredResults].sort((a, b) => a.minScore - b.minScore);

  // Gán level cho từng phần tử
  const resultsWithLevels = sortedResults.map((result, index) => ({
    ...result,
    level: index + 1, // Level bắt đầu từ 1
  }));

  return resultsWithLevels;
};

const getLevelColor = (level: number) => {
  const colors = [
    "#4caf50", // Level 1: Green
    "#8bc34a", // Level 2: Light Green
    "#cddc39", // Level 3: Lime
    "#ffeb3b", // Level 4: Yellow
    "#ffc107", // Level 5: Amber
    "#ff9800", // Level 6: Orange
    "#f44336", // Level 7: Red
  ];
  return colors[level - 1] || "#ccc"; // Default color if level is out of range
};

const generateRecommendations = (score: number, anxietyLevel: string) => {
  if (anxietyLevel === "Rất nặng") {
    return [
      "Liên hệ ngay với chuyên gia tâm lý để được hỗ trợ khẩn cấp.",
      "Tham gia các buổi trị liệu chuyên sâu với bác sĩ tâm lý.",
      "Thực hiện các bài tập thư giãn và giảm căng thẳng hàng ngày.",
    ];
  } else if (anxietyLevel === "Nặng") {
    return [
      "Tham gia liệu pháp tâm lý với chuyên gia.",
      "Đặt lịch hẹn với bác sĩ tâm lý để được tư vấn chi tiết.",
      "Thực hiện các bài tập thư giãn như thiền hoặc yoga.",
    ];
  } else if (anxietyLevel === "Vừa phải") {
    return [
      "Thực hành kỹ thuật thở sâu hàng ngày.",
      "Tập thể dục thường xuyên để giảm căng thẳng.",
      "Tham gia các khóa học về quản lý căng thẳng.",
    ];
  } else {
    return [
      "Duy trì lối sống lành mạnh và cân bằng.",
      "Thực hiện các hoạt động giải trí để thư giãn.",
      "Theo dõi cảm xúc và viết nhật ký hàng ngày.",
    ];
  }
};

const SurveyResultsDashboard = () => {
  const { accountSurveyId } = useParams<{ accountSurveyId: string }>();
  const [accountData, setAccountData] = useState<{ fullname: string; imgUrl: string } | null>(null);
  const [accountSurvey, setAccountSurvey] = useState<any | null>(null);
  const [assessmentDate, setAssessmentDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState("tổng quan");
  const [surveyName, setSurveyName] = useState<string>("");
  const [surveyAnswerRecords, setSurveyAnswerRecords] = useState<any[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (accountId) {
        const account = await fetchAccountData();
        if (account) {
          setAccountData({
            fullname: account.fullname,
            imgUrl: `http://localhost:5199${account.imgUrl}`,
          });
        }
      }
      
      if (accountSurveyId) {
        // Fetch account survey data
        const survey = await fetchAccountSurvey(accountSurveyId);
        if (survey) {
          setAccountSurvey(survey);
          
          // Get survey name using surveyId from account survey
          if (survey.surveyId) {
            const name = await fetchSurveyName(survey.surveyId);
            if (name) {
              setSurveyName(name);
            }
          }

          // Format the createAt date
          const rawDate = new Date(survey.createAt);
          const formattedDate = `${rawDate.getDate().toString().padStart(2, "0")}/${(rawDate.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${rawDate.getFullYear()}`;
          setAssessmentDate(formattedDate);
        }

        // Fetch survey answer records
        const answerRecords = await fetchAccountSurveyData(accountSurveyId);
        if (answerRecords) {
          setSurveyAnswerRecords(answerRecords);
        }
      }
    };
    fetchData();
  }, [accountSurveyId]);

  useEffect(() => {
    const fetchData = async () => {
      if (accountSurvey?.surveyId) {
        const filteredResults = await fetchFilteredSurveyResults(accountSurvey.surveyId);

        // Gán level cho từng phần tử sau khi sắp xếp
        const resultsWithLevels = assignLevelsToFilteredResults(filteredResults);

        // Cập nhật state với kết quả đã gán level
        setFilteredResults(resultsWithLevels);

        console.log("Filtered Results with Levels:", resultsWithLevels);
      }
    };

    fetchData();
  }, [accountSurvey?.surveyId]);

  // Calculate total score from actual survey answers
  const calculateTotalScore = () => {
    if (!surveyAnswerRecords || surveyAnswerRecords.length === 0) return 0;
    
    const totalScore = surveyAnswerRecords.reduce((sum, record) => {
      return sum + (record.surveyAnswer?.point || 0);
    }, 0);
    
    return totalScore;
  };

  const totalScore = calculateTotalScore();

  const mockData = {
    user: {
      name: accountData?.fullname,
      profilePic: accountData?.imgUrl,
      surveyDate: assessmentDate,
    },
    surveyName: surveyName,
    scores: {
      overall: totalScore,
      // Keep sections for fallback if needed
      sections: [
        { name: "Cảm thấy lo lắng hoặc bồn chồn", score: 2, maxScore: 3 },
        { name: "Không thể kiểm soát lo lắng", score: 2, maxScore: 3 },
        { name: "Lo lắng về nhiều thứ khác nhau", score: 1, maxScore: 3 },
        { name: "Khó thư giãn", score: 2, maxScore: 3 },
        { name: "Bồn chồn", score: 2, maxScore: 3 },
        { name: "Dễ cáu gắt", score: 1, maxScore: 3 },
        { name: "Cảm thấy sợ hãi", score: 2, maxScore: 3 },
      ],
    },
    anxietyLevel: "Lo âu vừa phải",
    recommendations: [
      { 
        type: "ngắn hạn", 
        items: ["Thực hành kỹ thuật thở sâu", "Tập thể dục thường xuyên", "Giữ nhật ký cảm xúc"] 
      },
      { 
        type: "dài hạn", 
        items: ["Tham gia liệu pháp tâm lý", "Phát triển kỹ năng đối phó với căng thẳng", "Duy trì lối sống cân bằng"] 
      }
    ],
  };

  const getScoreColor = (score: number, filteredResults: any[]) => {
    if (!filteredResults || filteredResults.length === 0) {
      return "score-gray"; // Mặc định nếu không có dữ liệu
    }
  
    // Tìm khoảng điểm phù hợp
    const matchingResult = filteredResults.find(
      (result: any) => score >= result.minScore && score <= result.maxScore
    );
  
    // Trả về lớp CSS dựa trên khoảng điểm
    if (matchingResult) {
      const { maxScore } = matchingResult;
      if (maxScore <= 4) return "score-green";
      if (maxScore <= 9) return "score-yellow";
      if (maxScore <= 14) return "score-orange";
      if (maxScore <= 19) return "score-red";
    }
  
    return "score-gray"; // Mặc định nếu không tìm thấy
  };

  const getAnxietyLevel = (score: number, filteredResults: any[]) => {
    if (!filteredResults || filteredResults.length === 0) {
      return "Không xác định";
    }
  
    const matchingResult = filteredResults.find(
      (result: any) => score >= result.minScore && score <= result.maxScore
    );
  
    return matchingResult ? matchingResult.resultDescription : "Không xác định";
  };
  
  useEffect(() => {
    const fetchData = async () => {
      if (accountSurvey?.surveyId) {
        // Fetch filtered survey results
        const filteredResults = await fetchFilteredSurveyResults(accountSurvey.surveyId);

        // Calculate anxiety level based on totalScore and filtered results
        const anxietyLevel = getAnxietyLevel(totalScore, filteredResults);

        // Log the anxiety level
        console.log("Anxiety Level:", anxietyLevel);
      }
    };

    fetchData();
  }, [accountSurvey?.surveyId, totalScore]);

  const ScoreOverview = ({ filteredResults }: { filteredResults: any[] }) => {
    // Sắp xếp filteredResults theo minScore
    const sortedResults = [...filteredResults].sort((a, b) => a.minScore - b.minScore);

    return (
      <div className="score-overview">
        <h2 className="title">{mockData.surveyName || "Assessment Results"}</h2>
        <div className="score-details">
          <h3>Điểm số của bạn</h3>
          <p className="score">{mockData.scores.overall}</p>
          <p className={`anxiety-level ${getScoreColor(totalScore, filteredResults)}`}>
            {getAnxietyLevel(totalScore, filteredResults)}
          </p>
        </div>
        <div className="result-descriptions">
          {sortedResults.map((result: any, index: number) => (
            <div key={index} className="result-description">
              <div className="description-header">
                <span
                  className="description-color"
                  style={{ backgroundColor: getLevelColor(result.level) }} // Áp dụng màu theo level
                />
                <span className="description-title">
                  {result.resultDescription} ({result.minScore}-{result.maxScore})
                </span>
              </div>
              <p className="description-text">{result.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Details = () => (
    <div className="details">
      <h2 className="title">Chi tiết đánh giá</h2>
      <table>
        <thead>
          <tr>
            <th>Câu Hỏi</th>
            <th>Điểm</th>
            <th>Câu Trả Lời</th>
          </tr>
        </thead>
        <tbody>
          {surveyAnswerRecords.length > 0 ? (
            surveyAnswerRecords.map((record, index) => (
              <tr key={index}>
                <td>{record.surveyQuestion?.contentQ || "Không có nội dung câu hỏi"}</td>
                <td>{record.surveyAnswer?.point || 0}/3</td>
                <td>
                  <span className={`frequency ${getScoreColor(record.surveyAnswer?.point || 0, filteredResults)}`}>
                    {record.surveyAnswer?.content || "Không có câu trả lời"}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            // Fallback to mock data if no records found
            mockData.scores.sections.map((section, index) => (
              <tr key={index}>
                <td>{section.name}</td>
                <td>{section.score}/{section.maxScore}</td>
                <td>
                  <span className={`frequency ${getScoreColor(section.score, filteredResults)}`}>
                    {section.score === 0 ? "Không bao giờ" :
                      section.score === 1 ? "Vài ngày" :
                        section.score === 2 ? "Hơn một nửa số ngày" :
                          "Hầu như mỗi ngày"}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <Header />
      <div className="survey-results-dashboard">
        <div className="user-info-card card">
          <div className="user-info">
            <img src={mockData.user.profilePic} alt="Ảnh đại diện" />
            <div>
              <h1>{mockData.user.name}</h1>
              <p>Ngày đánh giá: {mockData.user.surveyDate}</p>
            </div>
          </div>
        </div>

        <div className="tabs">
          {["tổng quan", "chi tiết", "khuyến nghị"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "active" : ""}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="content">
          {activeTab === "tổng quan" && <ScoreOverview filteredResults={filteredResults} />}
          {activeTab === "chi tiết" && <Details />}
          {activeTab === "khuyến nghị" && (
            <div className="recommendations">
              <h2 className="title">Gợi ý</h2>
              <ul>
                {generateRecommendations(totalScore, getAnxietyLevel(totalScore, filteredResults)).map((item, index) => (
                  <li key={index}>
                    <FaArrowRight />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Gợi ý đăng ký hoặc đặt lịch */}
              <div className="suggestions">
                {totalScore < 15 ? (
                  <div className="suggestion">
                    <h3>Gợi ý thêm</h3>
                    <p>Chúng tôi khuyến nghị bạn đăng ký một khóa học để cải thiện sức khỏe tinh thần.</p>
                    <button
                      className="register-course-button"
                      onClick={() => {
                        window.location.href = "/dich-vu";
                      }}
                    >
                      Đăng ký khóa học
                    </button>
                  </div>
                ) : (
                  <div className="suggestion">
                    <h3>Gợi ý thêm</h3>
                    <p>Chúng tôi khuyến nghị bạn đặt lịch với chuyên gia để được tư vấn chi tiết.</p>
                    <button
                      className="book-expert-button"
                      onClick={() => {
                        window.location.href = "/booking";
                      }}
                    >
                      Đặt lịch với chuyên gia
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SurveyResultsDashboard;