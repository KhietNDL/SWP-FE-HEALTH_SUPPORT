import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { RootState } from "../../redux/Store";
import { setOrder } from "../../redux/features/orderSlice";
import "../../components/OrderDetail/OrderDetail.scss";

const OrderDetail: React.FC = () => {
  console.log("🔥 OrderDetail.tsx đã render");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // Lấy subscriptionId từ state được truyền qua navigate
  const subscriptionId = location.state?.subscriptionId;

  // Get data from Redux Store
  const order = useSelector((state: RootState) => state.order?.currentOrder);
  const user = useSelector((state: RootState) => state.user) || { fullname: "Đang cập nhật" };

  console.log("Redux Order:", order);
  console.log("Redux User:", user);
  console.log("Subscription ID from state:", subscriptionId);

  // Xử lý nếu không tìm thấy đơn hàng
  if (!order) {
    return <div className="order-detail-container">Không tìm thấy đơn hàng!</div>;
  }

  // Xử lý điều hướng khi xác nhận đơn hàng
  const handleConfirm = async () => {
    try {
        console.log("Preparing data to send to API...");

        if (!order) {
            console.error("Order data is missing!");
            alert("Không tìm thấy thông tin đơn hàng. Vui lòng thử lại.");
            return;
        }

        if (!subscriptionId) {
            console.error("Subscription ID is missing!");
            alert("Không tìm thấy thông tin gói dịch vụ. Vui lòng thử lại.");
            return;
        }

        // Dữ liệu gửi đến API - sử dụng subscriptionId từ state
        const requestData = {
            subscriptionId: subscriptionId, // Lấy từ location.state
            accountId: user.id,
            quantity: order.quantity,
            createAt: order.createAt,
        };

        console.log("Request Data:", requestData);

        // Gửi request đến API
        const response = await fetch("http://localhost:5199/Order/CreateVnPay", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
        });

        console.log("API Response Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error Response:", errorText);
            throw new Error(`Failed to create VNPAY: ${response.status}`);
        }

        // Lấy paymentUrl từ API
        const responseData = await response.json();
        console.log("API Response Data:", responseData);

        const paymentUrl = responseData.paymentUrl;

        if (!paymentUrl) {
            throw new Error("API did not return a payment URL");
        }

        console.log("Redirecting to payment URL:", paymentUrl);

        // Điều hướng đến paymentUrl
        window.location.href = paymentUrl;
    } catch (error) {
        console.error("Error creating VNPAY:", error);
        alert("Không thể tạo thanh toán. Vui lòng thử lại sau.");
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
