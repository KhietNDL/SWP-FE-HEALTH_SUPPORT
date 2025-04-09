import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import "./OrderProgress.scss";
import { RootState } from "../../redux/Store";

interface Progress {
  id: string;
  section: number;
  description: string;
  date: number;
  subscriptionName: string;
  isCompleted: boolean;
  createAt: string;
  startDate : string;
  modifiedAt: string | null;
}

const OrderProgress: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [progressData, setProgressData] = useState<Progress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeProgress, setActiveProgress] = useState<string | null>(null);
  const [resolvedSubscriptionId, setResolvedSubscriptionId] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<{ id: string; name: string }[]>([]); // State to store all subscriptions
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const subscriptionId = queryParams.get("subscriptionId");
  const subscriptionName = queryParams.get("subscriptionName");

  // Fetch accountId from Redux store
  const accountId = useSelector((state: RootState) => state.user?.id) || null;

  // Fetch userName from Redux store
  const userName = useSelector((state: RootState) => state.user?.userName) || null;

  // Fetch all subscriptions on component mount
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await fetch(`http://localhost:5199/Subscription`);
        if (!response.ok) {
          throw new Error(`Failed to fetch subscriptions: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched subscriptions:", data);
        setSubscriptions(data); // Save all subscriptions to state
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      }
    };

    fetchSubscriptions();
  }, []);

  // Resolve subscriptionId from subscriptionName
  useEffect(() => {
    const resolveSubscriptionId = () => {
      if (!subscriptions || subscriptions.length === 0) {
        console.warn("Subscriptions list is not loaded yet. Retrying...");
        return;
      }

      if (subscriptionId) {
        console.log(`Using subscriptionId from query params: ${subscriptionId}`);
        setResolvedSubscriptionId(subscriptionId); // Use subscriptionId from query params if available
        return;
      }

      if (!subscriptionName) {
        console.error("No subscriptionName provided to resolve subscriptionId.");
        return;
      }

      console.log(`Searching for subscriptionName: "${subscriptionName}" in subscriptions list.`);

      // Find subscriptionId from subscriptionName in the subscriptions list
      const subscription = subscriptions.find(
        (sub) => sub.subscriptionName === subscriptionName
      );

      if (subscription) {
        console.log(`Resolved subscriptionId: ${subscription.id} for subscriptionName: ${subscriptionName}`);
        setResolvedSubscriptionId(subscription.id);
      } else {
        console.error(`Failed to resolve subscriptionId for subscriptionName: "${subscriptionName}"`);
        console.error("Available subscriptions:", subscriptions);
      }
    };

    resolveSubscriptionId();
  }, [subscriptionId, subscriptionName, subscriptions]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!subscriptionName) {
        console.error("No subscriptionName provided.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5199/SubscriptionProgress?subscriptionName=${encodeURIComponent(subscriptionName)}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch SubscriptionProgress: ${response.status} - ${errorText}`);
        }

        const subscriptionProgressData: Progress[] = await response.json();

        // Lọc dữ liệu chỉ lấy các progress của chương trình hiện tại
        const filteredData = subscriptionProgressData.filter(
          (progress) => progress.subscriptionName === subscriptionName
        );

        // Sắp xếp theo thứ tự section từ nhỏ đến lớn
        filteredData.sort((a, b) => a.section - b.section);

        console.log("Filtered and sorted subscription progress data:", filteredData);

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
  }, [subscriptionName]);

  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!userName || !resolvedSubscriptionId) {
        console.error("Missing userName or resolvedSubscriptionId.");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5199/UserProgress?subscriptionId=${resolvedSubscriptionId}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response from backend when fetching UserProgress:", errorText);
          throw new Error(`Failed to fetch UserProgress: ${response.status} - ${errorText}`);
        }

        const userProgressList = await response.json();
        console.debug("Fetched UserProgress:", userProgressList);

        // Đồng bộ dữ liệu UserProgress vào Progress
        setProgressData((prevData) =>
          prevData.map((progress) => {
            const userProgress = userProgressList.find(
              (up: any) =>
                up.section === progress.section &&
                up.subscriptionName === progress.subscriptionName &&
                up.accountName === userName // Lọc theo userName
            );
            return userProgress
              ? { ...progress, ...userProgress, isCompleted: true } // Thay thế dữ liệu từ UserProgress
              : progress;
          })
        );
      } catch (error) {
        console.error("Error fetching UserProgress:", error);
      }
    };

    fetchUserProgress();
  }, [userName, resolvedSubscriptionId]); // Đảm bảo gọi lại khi userName hoặc resolvedSubscriptionId thay đổi

  // Ensure resolvedSubscriptionId is ready before calling handleComplete
  const handleComplete = async (
    subscriptionProgressId: string, // Đây là progressId của SubscriptionProgress
    section: number,
    description: string,
    date: number
  ) => {
    try {
      if (!accountId) {
        throw new Error("Account ID is missing hoặc invalid.");
      }

      if (!resolvedSubscriptionId) {
        console.warn("Attempting to resolve subscriptionId again...");
        const subscription = subscriptions.find(
          (sub) => sub.subscriptionName === subscriptionName
        );
        if (subscription) {
          console.log(`Resolved subscriptionId: ${subscription.id} for subscriptionName: ${subscriptionName}`);
          setResolvedSubscriptionId(subscription.id);
        } else {
          console.error(`Failed to resolve subscriptionId for subscriptionName: "${subscriptionName}"`);
          throw new Error("Subscription ID is missing hoặc invalid.");
        }
      }

      // Payload gửi đến backend để tạo UserProgress
      const createPayload = {
        section,
        description,
        date,
        subscriptionId: resolvedSubscriptionId,
        accountId,
        isCompleted: false, // Initially set isCompleted to false
      };

      console.log("Payload gửi đến backend để tạo UserProgress:", createPayload);

      const createResponse = await fetch(`http://localhost:5199/UserProgress/Create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error("Error response từ backend khi tạo UserProgress:", errorText);
        throw new Error(`Failed to create UserProgress: ${createResponse.status} - ${errorText}`);
      }

      console.log("UserProgress created successfully!");

      // Fetch the newly created UserProgress to get its ID
      const userProgressList = await fetch(
        `http://localhost:5199/UserProgress?accountId=${accountId}&subscriptionId=${resolvedSubscriptionId}`
      ).then((res) => res.json());

      const createdUserProgress = userProgressList.find(
        (up: any) => up.section === section
      );

      if (!createdUserProgress) {
        throw new Error("Failed to find the newly created UserProgress.");
      }

      // Immediately update isCompleted to true in the database
      const updatePayload = { ...createdUserProgress, isCompleted: true };
      const updateResponse = await fetch(
        `http://localhost:5199/UserProgress/${createdUserProgress.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("Error response từ backend khi cập nhật UserProgress:", errorText);
        throw new Error(`Failed to update UserProgress: ${updateResponse.status} - ${errorText}`);
      }

      console.log("UserProgress updated successfully!");

      // Cập nhật trực tiếp progressData trong state
      setProgressData((prevData) =>
        prevData.map((progress) =>
          progress.section === section
            ? { ...progress, ...createdUserProgress, isCompleted: true } // Thay thế dữ liệu từ UserProgress
            : progress
        )
      );

      console.log("Updated progressData state after completion.");
    } catch (error) {
      console.error("Error trong handleComplete:", error);
    }
  };

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

  const completedPercentage = Math.round(
    (progressData.filter((p) => p.isCompleted).length / progressData.length) * 100
  );

  return (
    <div className="order-progress-container">
      <div className="order-progress-content">
        <h1 className="order-progress-title">
          {progressData.length > 0 ? progressData[0].subscriptionName : "Không có tiến trình nào"}
        </h1>

        <button className="back-button" onClick={() => navigate(-1)}>
          Quay lại
        </button>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.round(
                  (progressData.filter((p) => p.isCompleted).length / progressData.length) * 100
                )}%`,
              }}
            ></div>
          </div>
          <p className="progress-percentage">
            {Math.round(
              (progressData.filter((p) => p.isCompleted).length / progressData.length) * 100
            )}
            % hoàn thành
          </p>
        </div>

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
                    className={`session-item ${progress.id === activeProgress ? "active" : ""}`}
                    onClick={() => setActiveProgress(progress.id)}
                  >
                    <div className="session-number">Buổi {progress.section}</div>
                    <p className={progress.isCompleted ? "completed-label" : "incomplete-label"}>
                      {progress.isCompleted ? "Đã hoàn thành" : "Chưa hoàn thành"}
                    </p>
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
                    Ngày tạo: {formatDate(getCurrentProgress()?.startDate || "")}
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
                  <div class="info-item">
                    <span class="info-label">Ngày cập nhật:</span>
                    <span class="info-value">
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





























