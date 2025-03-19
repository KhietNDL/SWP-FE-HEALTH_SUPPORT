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
  const handleConfirm = () => {
    console.log("Navigating to payment page");
    navigate(`/payment`);
  };

  // xử lí khi bấm nút hủy: 
  const handleCancel = () => {
    console.log("Hủy đơn hàng, quay lại trang trước");
    dispatch(setOrder(null));
    navigate(-1);
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
