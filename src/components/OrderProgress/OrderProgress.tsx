import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./OrderProgress.scss";

interface Progress {
  id: string;
  section: number;
  description: string;
  date: number;
  subscriptionName: string;
  isCompleted: boolean;
  createAt: string;
  modifiedAt: string | null;
}

const OrderProgress: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [progressData, setProgressData] = useState<Progress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeProgress, setActiveProgress] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const subscriptionName = queryParams.get("subscriptionName");

    if (!subscriptionName) {
      console.error("No subscriptionName provided in query parameters.");
      setIsLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        const response = await fetch(`http://localhost:5199/SubscriptionProgress`);
        if (!response.ok) {
          throw new Error(`Failed to fetch progress data: ${response.status}`);
        }
        const data: Progress[] = await response.json();

        // Filter progress data by subscriptionName
        const filteredData = data.filter(
          (progress) => progress.subscriptionName === subscriptionName
        );

        filteredData.sort((a, b) => a.section - b.section); // Sort by section in ascending order
        setProgressData(filteredData);

        if (filteredData.length > 0) {
          setActiveProgress(filteredData[0].id);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching progress data:", error);
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [location.search]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getCurrentProgress = () => {
    return progressData.find((p) => p.id === activeProgress) || null;
  };

  return (
    <div className="order-progress-container">
      <div className="order-progress-content">
        <h1 className="order-progress-title">
          {progressData.length > 0 ? progressData[0].subscriptionName : "Không có tiến trình nào"}
        </h1>

        <button className="back-button" onClick={() => navigate(-1)}>
          Quay lại
        </button>

        <div className="content-layout">
          {/* Sidebar */}
          <div className="sessions-sidebar">
            <h2 className="sidebar-title">Tiến trình</h2>
            {isLoading ? (
              <div className="loading">Đang tải...</div>
            ) : progressData.length === 0 ? (
              <div className="no-progress">Không có tiến trình nào để hiển thị.</div>
            ) : (
              <div className="sessions-list">
                {progressData.map((progress) => (
                  <div
                    key={progress.id}
                    className={`session-item ${
                      progress.id === activeProgress ? "active" : ""
                    }`}
                    onClick={() => setActiveProgress(progress.id)}
                  >
                    <div className="session-number">Buổi {progress.section}</div>
                    <div className="session-date">Ngày: {formatDate(progress.date.toString())}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="session-content-area">
            {isLoading ? (
              <div className="loading">Đang tải nội dung...</div>
            ) : activeProgress ? (
              <div className="session-details">
                <div className="session-header">
                  <h2>Buổi {getCurrentProgress()?.section}</h2>
                  <div className="session-meta">
                    Ngày tạo: {formatDate(getCurrentProgress()?.createAt || "")}
                  </div>
                </div>
                <div className="session-description">
                  <h3>Mô tả</h3>
                  <p>{getCurrentProgress()?.description}</p>
                </div>
                <div className="session-info">
                  <div className="info-item">
                    <span className="info-label">Hoàn thành:</span>
                    <span className="info-value">
                      {getCurrentProgress()?.isCompleted ? "Có" : "Không"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Ngày cập nhật:</span>
                    <span className="info-value">
                      {getCurrentProgress()?.modifiedAt
                        ? formatDate(getCurrentProgress()?.modifiedAt)
                        : "Chưa cập nhật"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-session">
                <p>Vui lòng chọn một phần từ danh sách bên trái</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderProgress;
