import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/Store";
import { useNavigate } from "react-router-dom";
import "./ProgressInformation.scss";


interface Order {
  id: string;
  subscriptionName: string;
  description: string;
  price: number;
  quantity: number;
  accountName: string;
  accountEmail: string;
  createAt: string;
  modifiedAt: string | null;
  isActive: boolean;
  isDeleted: boolean; // Use isDeleted instead of isCanceled
  isJoined?: boolean; // Add isJoined property
  isSuccessful: boolean;
}


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


const ProgressInformation: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<{ id: string; name: string }[]>([]); // State to store all subscriptions
  const [progressData, setProgressData] = useState<Progress[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [isLoadingProgress, setIsLoadingProgress] = useState<boolean>(false);
  const [activeOrder, setActiveOrder] = useState<string | null>(null);


  // Get accountEmail from Redux Store
  const accountEmail = useSelector((state: RootState) => state.user?.email);
  const navigate = useNavigate();


  useEffect(() => {
    console.log("Current accountEmail:", accountEmail); // Debug log
    setOrders([]); // Reset orders khi accountEmail thay đổi
    setIsLoadingOrders(true); // Hiển thị trạng thái loading


    if (!accountEmail) {
      console.log("No accountEmail provided."); // Debug log
      setIsLoadingOrders(false);
      return;
    }


    const fetchOrders = async () => {
      try {
        console.log("Fetching orders for accountEmail:", accountEmail); // Debug log
        const response = await fetch(`http://localhost:5199/Order?accountEmail=${encodeURIComponent(accountEmail)}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status}`);
        }


        const data: Order[] = await response.json();
        console.log("Fetched orders:", data); // Debug log


        // Filter orders to ensure they belong to the current accountEmail and are successful
        const filteredOrders = data.filter(order => order.accountEmail === accountEmail && order.isSuccessful === true);
        console.log("Filtered orders:", filteredOrders); // Debug log


        setOrders(filteredOrders); // Cập nhật dữ liệu mới
        setIsLoadingOrders(false);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setIsLoadingOrders(false);
      }
    };


    fetchOrders();
  }, [accountEmail]); // Thêm accountEmail vào dependency để gọi lại khi thay đổi


  useEffect(() => {
    // Clear orders when accountEmail changes to avoid showing stale data
    setOrders([]);
  }, [accountEmail]);


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


  const fetchProgress = async (subscriptionName: string) => {
    setIsLoadingProgress(true);
    try {
      const response = await fetch(
        `http://localhost:5199/SubscriptionProgress?subscriptionName=${encodeURIComponent(subscriptionName)}`
      );


      if (!response.ok) {
        throw new Error(`Failed to fetch progress data: ${response.status}`);
      }


      const data: Progress[] = await response.json();
      console.log("Fetched progress data:", data);


      data.sort((a, b) => a.section - b.section); // Sort by section in ascending order
      setProgressData(data);
      setIsLoadingProgress(false);
    } catch (error) {
      console.error("Error fetching progress data:", error);
      setIsLoadingProgress(false);
    }
  };


  const cancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`http://localhost:5199/Order/${orderId}`, {
        method: "DELETE",
      });


      if (!response.ok) {
        throw new Error(`Failed to cancel order: ${response.status}`);
      }


      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, isDeleted: true } : order
        )
      );
    } catch (error) {
      console.error("Error canceling order:", error);
    }
  };


  const joinOrder = async (orderId: string, subscriptionName: string) => {
    try {
      const orderToUpdate = orders.find((order) => order.id === orderId);
      if (!orderToUpdate) {
        throw new Error("Order not found");
      }


      // Cập nhật trạng thái isJoined trong backend
      const updatedOrder = {
        ...orderToUpdate,
        isJoined: true, // Đánh dấu là đã tham gia
      };


      const response = await fetch(`http://localhost:5199/Order/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedOrder),
      });


      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update order: ${response.status} - ${errorText}`);
      }


      // Cập nhật trạng thái trong state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, isJoined: true } : order
        )
      );


      console.log("Order joined successfully:", updatedOrder);


      // Điều hướng đến trang OrderProgress
      navigate(`/progress/${orderId}?subscriptionName=${encodeURIComponent(subscriptionName)}`);
    } catch (error) {
      console.error("Error joining order:", error);
    }
  };


  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) {
      return "Không xác định"; // Trả về giá trị mặc định nếu dateString không hợp lệ
    }
 
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Không hợp lệ"; // Trả về giá trị nếu dateString không thể chuyển đổi thành ngày
    }
 
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };


  const getCurrentProgress = () => {
    return progressData.find((p) => p.id === activeOrder) || null;
  };


  return (
    <div className="course-container">
      <div className="course-content">
        <h1 className="course-title">Danh sách đơn hàng</h1>


        {isLoadingOrders ? (
          <div className="loading">Đang tải danh sách đơn hàng...</div>
        ) : orders.length === 0 ? (
          <div className="no-orders">Không có đơn hàng nào.</div> // Hiển thị thông báo nếu không có đơn hàng
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`order-item ${order.isDeleted ? "canceled" : ""}`}
              >
                <div className="order-info">
                  <p><strong>Tên gói:</strong> {order.subscriptionName}</p>
                  <p><strong>Ngày đặt:</strong> {formatDate(order.createAt)}</p>
                  <p><strong>Giá:</strong> {order.price.toLocaleString()} VNĐ</p>
                  {order.isDeleted && <p className="canceled-label">Đã hủy</p>}
                </div>
                {!order.isDeleted && (
                  <button
                    className="view-progress-button"
                    onClick={() => {
                      if (!order.isJoined) {
                        joinOrder(order.id, order.subscriptionName); // Gọi hàm tham gia
                      } else {
                        navigate(
                          `/progress/${order.id}?subscriptionName=${encodeURIComponent(order.subscriptionName)}`
                        ); // Điều hướng đến trang tiến trình
                      }
                    }}
                  >
                    {order.isJoined ? "Xem Tiến Trình" : "Xem Tiến Trình"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}


        {activeOrder && (
          <div className="content-layout">
            {/* Sidebar */}
            <div className="sessions-sidebar">
              <h2 className="sidebar-title">Tiến trình</h2>
              {isLoadingProgress ? (
                <div className="loading">Đang tải...</div>
              ) : (
                <div className="sessions-list">
                  {progressData.map((progress) => (
                    <div
                      key={progress.id}
                      className={`session-item ${
                        progress.id === activeOrder ? "active" : ""
                      }`}
                      onClick={() => setActiveOrder(progress.id)}
                    >
                      <div className="session-number">Buổi {progress.section}</div>
                      <div className="session-date">
                        Ngày: {formatDate(progress.createAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Content Area */}
            <div className="session-content-area">
              {isLoadingProgress ? (
                <div className="loading">Đang tải nội dung...</div>
              ) : activeOrder ? (
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
        )}
      </div>
    </div>
  );
};


export default ProgressInformation;

