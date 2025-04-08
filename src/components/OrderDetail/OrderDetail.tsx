import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { RootState } from "../../redux/Store";
import { setOrder } from "../../redux/features/orderSlice";
import "../../components/OrderDetail/OrderDetail.scss";
import { OrderDetailProps } from '../../types/OrderDetail';

const OrderDetail: React.FC<OrderDetailProps> = ({
  id,
  programId,
  packageName,
  fullname,
  orderDate,
  startDate,
  endDate,
  price,
  duration,
}) => {
  console.log("🔥 OrderDetail.tsx đã render");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Lấy subscriptionId từ state được truyền qua navigate
  const subscriptionId = location.state?.subscriptionId;

  // Get data from Redux Store
  const order = useSelector((state: RootState) => state.order?.currentOrder);
  const user = useSelector((state: RootState) => state.user) || { fullname: "Đang cập nhật" };

  // Fetch order details if not in Redux store
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!order && id) {
        try {
          const response = await fetch(`http://localhost:5199/Order/${id}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch order: ${response.status}`);
          }
          const orderData = await response.json();
          dispatch(setOrder(orderData));
        } catch (error) {
          console.error("Error fetching order details:", error);
        }
      }
    };

    fetchOrderDetails();
  }, [id, order, dispatch]);

  console.log("Redux Order:", order);
  console.log("Redux User:", user);
  console.log("Subscription ID from state:", subscriptionId);
  console.log("Order ID from URL:", id);

  // Xử lý nếu không tìm thấy đơn hàng
  if (!order) {
    return <div className="order-detail-container">Đang tải thông tin đơn hàng...</div>;
  }

  // Xử lý điều hướng khi xác nhận đơn hàng
  const handleConfirm = () => {
    setIsLoading(true);
    
    // Add a 3-second delay before navigation
    setTimeout(() => {
      // Navigate to PaymentMethod with orderId and price from Redux store
      navigate(`/payment-method?orderId=${order.id}&price=${order.price}`);
    }, 3000);
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

  const handleRedirect = () => {
    navigate("/payment-method");
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
          <button className="confirm-button" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "⏳ Đang xử lý..." : "✔ Đồng ý"}
          </button>
          <button className="cancel-button" onClick={handleCancel} disabled={isLoading}>❌ Hủy</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;