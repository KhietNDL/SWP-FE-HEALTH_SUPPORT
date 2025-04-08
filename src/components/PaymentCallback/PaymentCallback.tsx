import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PaymentCallback.scss';

const PaymentCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'loading'>('loading');
  const [message, setMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Lấy query parameters từ URL
        const queryParams = new URLSearchParams(location.search);
        const status = queryParams.get("paymentStatus");
        const txnId = queryParams.get("transactionId");
        
        console.log("Payment Status:", status);
        console.log("Transaction ID:", txnId);
        
        if (txnId) {
          setTransactionId(txnId);
        }

        // Kiểm tra trạng thái thanh toán từ redirect
        if (status === "success") {
          setPaymentStatus('success');
          
          // Gọi API để lấy thông tin chi tiết giao dịch
          try {
            const response = await fetch(`http://localhost:5199/api/Transaction/${txnId}`);
            
            if (response.ok) {
              const transactionData = await response.json();
              console.log("Transaction Data:", transactionData);
              
              // Hiển thị thông tin giao dịch
              setMessage(`Thanh toán thành công!
                Mã giao dịch: ${txnId}
                Số tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transactionData.amountPaid || 0)}`);
            } else {
              setMessage(`Thanh toán thành công!
                Mã giao dịch: ${txnId}`);
            }
          } catch (error) {
            console.error("Error fetching transaction details:", error);
            setMessage(`Thanh toán thành công!
              Mã giao dịch: ${txnId}`);
          }
        } else {
          setPaymentStatus('failed');
          setMessage('Thanh toán thất bại!');
        }

        // Chuyển về trang chủ sau 5 giây
        setTimeout(() => {
          navigate("/");
        }, 5000);
      } catch (error) {
        console.error("Error handling payment callback:", error);
        setPaymentStatus('failed');
        setMessage('Có lỗi xảy ra khi xử lý thanh toán!');
        setTimeout(() => {
          navigate("/");
        }, 5000);
      }
    };

    handleCallback();
  }, [location.search, navigate]);

  return (
    <div className="payment-callback-container">
      <div className="payment-callback-content">
        {paymentStatus === 'loading' && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Đang xử lý thanh toán...</p>
          </div>
        )}
        
        {paymentStatus === 'success' && (
          <div className="success">
            <div className="icon">✓</div>
            <h2>Thanh Toán Thành Công!</h2>
            <p>{message}</p>
            <p className="redirect">Bạn sẽ được chuyển về trang chủ sau 5 giây...</p>
          </div>
        )}
        
        {paymentStatus === 'failed' && (
          <div className="failed">
            <div className="icon">✕</div>
            <h2>Thanh Toán Thất Bại!</h2>
            <p>{message}</p>
            <p className="redirect">Bạn sẽ được chuyển về trang chủ sau 5 giây...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
