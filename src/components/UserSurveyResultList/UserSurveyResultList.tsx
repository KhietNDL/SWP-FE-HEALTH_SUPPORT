import React, { useEffect, useState } from "react";
import { AccountSurveyApi, surveyApi, surveyTypeApi } from "../../services/SurveyApiService";
import { Link } from "react-router-dom";
import "./UserSurveyResultList.scss";

interface SurveyResult {
  id: string;
  surveyName: string;
  date: string;
  rawDate: Date;
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
        const data = await AccountSurveyApi.getAccountSurveyByAccountId(accountId);

        // Fetch all surveys and create a mapping of surveyId to surveyName
        const surveys = await surveyApi.getAll();
        const surveyTypeMap = new Map(
          surveys.map((survey: any) => [survey.id, survey.surveyTypeId])
        );

        const surveyTypeIds = Array.from(surveyTypeMap.values()) as string[];
        const surveyTypesPromises = surveyTypeIds.map(id => surveyTypeApi.getBySurveyTypeId(id));
        const surveyTypes = await Promise.all(surveyTypesPromises);
        const surveyNameMap = new Map(
          surveyTypes.flat().map((type: any) => [type.id, type.surveyName])
        );

        // Map surveyId to surveyName
        const mappedResults = data
          .map((item: any) => {
            const surveyTypeId = surveyTypeMap.get(item.surveyId);
            const surveyName = surveyNameMap.get(surveyTypeId) || "Unknown Survey Name";

            // Định dạng ngày
            const date = new Date(item.createAt);
            const formattedDate = new Intl.DateTimeFormat("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(date);

            return {
              id: item.surveyId,
              surveyName,
              date: formattedDate, // Gán ngày đã định dạng
              rawDate: date, // Lưu thêm giá trị ngày thô để sắp xếp
            };
          })
          .sort((a: { rawDate: Date; }, b: { rawDate: Date; }) => b.rawDate.getTime() - a.rawDate.getTime()); // Sắp xếp từ gần nhất đến cũ nhất

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

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="user-survey-result-list">
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
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {surveyResults.map((result, index) => (
            <tr key={`${result.id}-${index}`}>
              <td>{result.surveyName}</td>
              <td>{result.date}</td>
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