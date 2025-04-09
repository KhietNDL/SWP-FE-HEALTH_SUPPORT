import React, { useEffect, useState } from "react";
import { AccountSurveyApi, SurveyAnswerRecordApi, surveyApi, surveyTypeApi } from "../../services/SurveyApiService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import "./UserSurveyResultList.scss";

interface SurveyResult {
  id: string;
  surveyName: string;
  date: string;
  rawDate: Date;
  totalPoints: number;
  maxScore: number;
}

// Get accountId from localStorage
const userInfo = localStorage.getItem("userInfo");
const accountId = userInfo ? JSON.parse(userInfo).id : null;

const UserSurveyResultList: React.FC = () => {
  const [surveyResults, setSurveyResults] = useState<SurveyResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc"); // "desc" là mặc định

  useEffect(() => {
    const fetchAccountSurveys = async () => {
      if (!accountId) {
        console.error("No account ID found in localStorage.");
        setLoading(false);
        return;
      }

      try {
        // Fetch account survey data by accountId
        const data = await AccountSurveyApi.getAccountSurveyByAccountId(accountId);

        // Fetch all SurveyAnswerRecord by AccountSurveyId
        const surveyAnswerPromises = data.map((item: any) =>
          SurveyAnswerRecordApi.getSurveyAnswerRecordByAccountSurveyId(item.id)
        );
        const surveyAnswers = await Promise.all(surveyAnswerPromises);

        // Fetch all surveys and create a mapping of surveyId to surveyName
        const surveys = await surveyApi.getAll();
        const surveysMaxScore = surveys.reduce((acc: any, survey: any) => {
          acc[survey.id] = survey.maxScore;
          return acc;
        }
        , {});

        const surveyTypeMap = new Map(
          surveys.map((survey: any) => [survey.id, survey.surveyTypeId])
        );

        const surveyTypeIds = Array.from(surveyTypeMap.values()) as string[];
        const surveyTypesPromises = surveyTypeIds.map(id => surveyTypeApi.getBySurveyTypeId(id));
        const surveyTypes = await Promise.all(surveyTypesPromises);
        const surveyNameMap = new Map(
          surveyTypes.flat().map((type: any) => [type.id, type.surveyName])
        );

        // Map surveyId to surveyName and calculate points
        const mappedResults = data
          .map((item: any, index: number) => {
            const surveyTypeId = surveyTypeMap.get(item.surveyId);
            const surveyName = surveyNameMap.get(surveyTypeId) || "Unknown Survey Name";

            // Get maxScore for the surveyName
            const maxScore = surveysMaxScore[item.surveyId] || 0;

            // Calculate total points for the survey
            const surveyAnswerRecords = surveyAnswers[index];
            const totalPoints = surveyAnswerRecords.reduce(
              (sum: number, record: any) => sum + (record.surveyAnswer?.point || 0),
              0
            );

            // Format the date
            const date = new Date(item.createAt);
            const formattedDate = new Intl.DateTimeFormat("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(date);

            return {
              id: item.id, // id of AccountSurvey
              surveyName, // Survey name
              date: formattedDate, // Formatted survey date
              rawDate: date, // Original survey date for sorting
              totalPoints, // Total points for the survey
              maxScore, // Max score for the survey
            };
          })
          .sort((a: { rawDate: Date }, b: { rawDate: Date }) => b.rawDate.getTime() - a.rawDate.getTime()); // Sort from newest to oldest

        setSurveyResults(mappedResults);
      } catch (error) {
        console.error("Error fetching account survey:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountSurveys();
  }, []);

  const sortSurveyResults = (order: "desc" | "asc") => {
    const sortedResults = [...surveyResults].sort((a, b) => {
      if (order === "desc") {
        return b.rawDate.getTime() - a.rawDate.getTime(); // Gần nhất đến cũ nhất
      } else {
        return a.rawDate.getTime() - b.rawDate.getTime(); // Cũ nhất đến gần nhất
      }
    });
    setSurveyResults(sortedResults);
  };

  // Group survey results by surveyName and sort by date (oldest to newest)
  const groupedResults = surveyResults.reduce((acc: any, result) => {
    if (!acc[result.surveyName]) {
      acc[result.surveyName] = [];
    }
    acc[result.surveyName].push(result);
    acc[result.surveyName].sort((a: SurveyResult, b: SurveyResult) => a.rawDate.getTime() - b.rawDate.getTime()); // Sort by rawDate (ascending)
    return acc;
  }, {});

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="user-survey-result-list">
      <h1>Điểm số theo từng bài khảo sát</h1>
      {Object.keys(groupedResults).map((surveyName) => {
        const surveyData = groupedResults[surveyName]; // Dữ liệu của bài khảo sát
        if (!surveyData || surveyData.length === 0) {
          return null; // Không hiển thị nếu không có dữ liệu
        }

        const maxScore = Math.max(...surveyData.map((result: any) => result.maxScore)); // Lấy maxScore lớn nhất cho surveyName

        return (
          <div key={surveyName} className="chart-container">
            <h2>{surveyName}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={surveyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  label={{ value: "Tổng Điểm", angle: -90, position: "insideLeft" }}
                  domain={[0, maxScore]} // Đặt domain từ 0 đến maxScore
                />
                <Tooltip />
                <Legend formatter={() => "Tổng Điểm"} />
                <Line
                  type="monotone"
                  dataKey="totalPoints"
                  name="Tổng Điểm"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
      <h1>Danh sách kết quả khảo sát</h1>
      <table>
        <thead>
          <tr>
            <th>Tên khảo sát</th>
            <th>
              Ngày thực hiện
              <button
                className="sort-button"
                onClick={() => {
                  const newOrder = sortOrder === "desc" ? "asc" : "desc";
                  setSortOrder(newOrder);
                  sortSurveyResults(newOrder);
                }}
              >
                {sortOrder === "desc" ? "↓↑" : "↑↓"}
              </button>
            </th>
            <th>Tổng Điểm</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {surveyResults.map((result, index) => (
            <tr key={`${result.id}-${index}`}>
              <td>{result.surveyName}</td>
              <td>{result.date}</td>
              <td>{result.totalPoints}</td>
              <td>
                <Link to={`/survey-result/${result.id}`} className="view-details">
                  Xem chi tiết
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserSurveyResultList;