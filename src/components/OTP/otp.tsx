import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal, Spin } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import './otp.scss';
import vnpayLogo from '../../images/vnpayheader.jpg';
import secureIcon from '../../images/secure.jpg';

const OTP: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get orderId and amount from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('price');

  useEffect(() => {
    // Focus the first input on component mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      if (pastedData.length === 6) {
        inputRefs.current[5]?.focus();
      } else if (pastedData.length < 6 && inputRefs.current[pastedData.length]) {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if OTP is complete
    if (otp.some(digit => !digit)) {
      return;
    }

    setIsLoading(true);
    setIsProcessing(true);

    try {
      // Simulate OTP verification delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const transactionData = {
        orderId: orderId,
        amount: parseFloat(amount || "0"),
        paymentMethod: "VNPay"
      };

      const response = await fetch('http://localhost:5199/api/Transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
      });

      if (!response.ok) {
        throw new Error('Transaction failed');
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsProcessing(false);

      // Show success modal
      setIsSuccessModalVisible(true);

      // Auto redirect after 5 seconds
      setTimeout(() => {
        setIsSuccessModalVisible(false);
        navigate('/');
      }, 5000);

    } catch (error) {
      console.error('Error creating transaction:', error);
      setIsProcessing(false);
      Modal.error({
        title: 'Thanh toán thất bại',
        content: 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="otp-container">
      <div className="header">
        <img src={vnpayLogo} alt="VNPAY" />
      </div>
      
      <div className="title">Xác thực OTP</div>
      
      <div className="description">
        Vui lòng nhập mã OTP được gửi đến số điện thoại của bạn để xác nhận thanh toán
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="otp-input-container">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              ref={(el) => (inputRefs.current[index] = el)}
              className="otp-input"
              pattern="[0-9]*"
              inputMode="numeric"
            />
          ))}
        </div>
        
        <button 
          type="submit" 
          className="submit-button" 
          disabled={isLoading || otp.some(digit => !digit)}
        >
          {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
        </button>
      </form>
      
      <div className="footer">
        <div className="contact">
          <div className="phone">
            <i className="phone-icon"></i>
            1900.5555.77
          </div>
          <div className="email">
            <i className="email-icon"></i>
            hotrovnpay@vnpay.vn
          </div>
        </div>
        <div className="security">
          <img src={secureIcon} alt="Secure Payment" />
        </div>
      </div>

      {/* Processing Modal */}
      <Modal
        visible={isProcessing}
        footer={null}
        closable={false}
        width={300}
        centered
        className="processing-modal"
        bodyStyle={{
          padding: '30px',
          textAlign: 'center',
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '20px'
        }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
          <p style={{ margin: '0', color: '#1890ff' }}>Đang xử lý thanh toán...</p>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={isSuccessModalVisible}
        footer={null}
        closable={false}
        width={400}
        centered
        className="success-modal"
        bodyStyle={{
          padding: '30px',
          textAlign: 'center',
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '20px'
        }}>
          <CheckCircleOutlined style={{ 
            fontSize: '60px', 
            color: '#52c41a'
          }} />
          <h2 style={{ 
            margin: '0',
            fontSize: '24px',
            color: '#52c41a'
          }}>
            Thanh toán thành công!
          </h2>
          <p style={{ 
            margin: '0',
            fontSize: '16px',
            color: '#8c8c8c'
          }}>
            Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi
          </p>
          <div style={{ 
            marginTop: '10px',
            padding: '10px 20px',
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: '4px',
            color: '#52c41a'
          }}>
            Tự động chuyển về trang chủ sau 5 giây...
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OTP;
