import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../redux/Store";
import { setOrder } from "../../redux/features/orderSlice";
import "../../components/OrderDetail/OrderDetail.scss";

const OrderDetail: React.FC = () => {
  console.log("🔥 OrderDetail.tsx đã render");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Lấy dữ liệu từ Redux Store
  const order = useSelector((state: RootState) => state.order?.currentOrder);
  const user = useSelector((state: RootState) => state.user) || { fullname: "Đang cập nhật" };

  console.log("Redux Order:", order);
  console.log("Redux User:", user);

  useEffect(() => {
    if (!order) {
      console.warn("Không tìm thấy đơn hàng!");
    }
  }, [order]);

  // Xử lý nếu không tìm thấy đơn hàng
  if (!order) {
    return <div className="order-detail-container">Không tìm thấy đơn hàng!</div>;
  }

  // Xử lý điều hướng khi xác nhận đơn hàng
  const handleConfirm = async () => {
    try {
      console.log("Fetching progress data and navigating to payment page");

      // Fetch progress data using subscriptionName
      const response = await fetch(
        `http://localhost:5199/SubscriptionProgress?subscriptionName=${encodeURIComponent(order.subscriptionName)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch progress data: ${response.status}`);
      }

      const progressData = await response.json();
      console.log("Progress data fetched successfully:", progressData);

      // Navigate to payment page
      navigate(`/payment`);
    } catch (error) {
      console.error("Error fetching progress data:", error);
      alert("Không thể lấy tiến trình. Vui lòng thử lại sau.");
    }
  };

  // xử lí khi bấm nút hủy: 
  const handleCancel = async () => {
    try {
      console.log("Hủy đơn hàng, xóa khỏi cơ sở dữ liệu");
      const response = await fetch(`http://localhost:5199/Order/${order.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete order: ${response.status}`);
      }

      console.log("Đơn hàng đã được xóa thành công");
      dispatch(setOrder(null));
      navigate(-1);
    } catch (error) {
      console.error("Lỗi khi xóa đơn hàng:", error);
      alert("Không thể xóa đơn hàng. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="order-detail-container">
      <div className="order-bill">
        <div className="bill-header">
          <h2>🧾 HÓA ĐƠN THANH TOÁN</h2>
          <span className="order-id">Mã đơn: #{order.id}</span>
        </div>

        <div className="bill-content">
          <div className="info-row"><span>Tên Gói:</span> <span>{order?.subscriptionName || "Đang cập nhật"}</span></div>
          <div className="info-row"><span>Người Đặt:</span> <span>{order.accountName || "Đang cập nhật"}</span></div>
          <div className="info-row"><span>Ngày Đặt:</span> <span>{order.createAt || "Đang cập nhật"}</span></div>
          <div className="info-row"><span>Tổng Tiền:</span> <span>{order.price ? `${order.price.toLocaleString()} VNĐ` : "Đang cập nhật"}</span></div>
        </div>

        <div className="bill-footer">
          <button className="confirm-button" onClick={handleConfirm}>✔ Đồng ý</button>
          
          <button className="cancel-button" onClick={handleCancel}>❌ Hủy</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
