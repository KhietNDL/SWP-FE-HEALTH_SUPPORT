import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PaymentCallback.scss';

const PaymentCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"success" | "error" | "pending">("pending");
  const [message, setMessage] = useState("Đang xử lý thanh toán...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Lấy parameters từ URL sau khi backend redirect về
        const params = new URLSearchParams(location.search);
        const paymentStatus = params.get('paymentStatus');
        const transactionId = params.get('transactionId');

        console.log("Payment Status:", paymentStatus);
        console.log("Transaction ID:", transactionId);

        const transactionDetails = await fetch(`http://localhost:5199/api/Transaction/${transactionId}`);

        if (paymentStatus === "success") {
          setStatus("success");
          setMessage("Thanh toán thành công! Bạn sẽ được chuyển hướng về trang chủ sau 5 giây.");
          
          // Có thể cập nhật Redux store hoặc thực hiện các tác vụ khác
          
          setTimeout(() => {
            navigate("/");
          }, 5000);
        } else {
          setStatus("error");
          setMessage("Thanh toán thất bại! Bạn sẽ được chuyển hướng về trang chủ sau 5 giây.");
          setTimeout(() => {
            navigate("/");
          }, 5000);
        }
      } catch (error) {
        console.error("Error processing payment callback:", error);
        setStatus("error");
        setMessage("Có lỗi xảy ra khi xử lý thanh toán.");
      }
    };

    handleCallback();
  }, [navigate, location]);

  return (
    <div className="payment-callback">
      <div className={`status-message ${status}`}>
        <h2>{message}</h2>
        <p>Vui lòng đợi trong giây lát...</p>
        {/* Có thể thêm thông tin chi tiết về giao dịch */}
      </div>
    </div>
  );
};

export default PaymentCallback;
