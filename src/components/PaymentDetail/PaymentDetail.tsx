// PaymentDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './PaymentDetail.scss';
import { Modal, Spin } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';

// Import bank logos
import vcbLogo from '../../images/vcb.png';
import mbLogo from '../../images/mb.jpg';
import acbLogo from '../../images/acb.png';
import bidvLogo from '../../images/bidv.png';
import tpbLogo from '../../images/tpb.png';
import agbLogo from '../../images/agb.jpg';
import scbLogo from '../../images/scb.jpg';
import vabLogo from '../../images/vab.jpg';
import vnpayLogo from '../../images/vnpayheader.jpg';
import secureIcon from '../../images/secure.jpg';

interface BankInfo {
  name: string;
  logo: string;
}

interface Banks {
  [key: string]: BankInfo;
}

interface FormData {
  accountNumber: string;
  accountName: string;
  address: string;
  issueDate: string;
  captcha: string;
}

type RouteParams = {
  [key: string]: string | undefined;
  bankId: string;
};

const PaymentDetail: React.FC = () => {
  const { bankId } = useParams<RouteParams>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [bankData, setBankData] = useState<BankInfo | null>(null);
  const [formData, setFormData] = useState<FormData>({
    accountNumber: '',
    accountName: '',
    address: '',
    issueDate: '',
    captcha: ''
  });

  // Get orderId and amount from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('price');
  
  const banks: Banks = {
    vcb: { name: 'Vietcombank (VCB)', logo: vcbLogo },
    mb: { name: 'Military Bank (MB)', logo: mbLogo },
    acb: { name: 'Asia Commercial Bank (ACB)', logo: acbLogo },
    bidv: { name: 'Bank for Investment and Development (BIDV)', logo: bidvLogo },
    tpb: { name: 'TPBank (TPB)', logo: tpbLogo },
    agb: { name: 'Agribank (AGB)', logo: agbLogo },
    scb: { name: 'Saigon Commercial Bank (SCB)', logo: scbLogo },
    vab: { name: 'Vietnam Asia Bank (VAB)', logo: vabLogo },
  };
  
  useEffect(() => {
    if (bankId && banks[bankId]) {
      setBankData(banks[bankId]);
    }
  }, [bankId]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setIsProcessing(true);

    try {
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
  
  if (!bankData) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="payment-detail-container">
      <div className="header">
        <img src={vnpayLogo} alt="VNPAY" />
      </div>
      
      <div className="title">Thông tin thanh toán</div>
      
      <div className="bank-info">
        <img src={bankData.logo} alt={bankData.name} />
        <div className="bank-name">{bankData.name}</div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Số tài khoản</label>
          <input 
            type="text" 
            name="accountNumber" 
            value={formData.accountNumber}
            onChange={handleChange}
            placeholder="Nhập số tài khoản"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Tên chủ tài khoản</label>
          <input 
            type="text" 
            name="accountName" 
            value={formData.accountName}
            onChange={handleChange}
            placeholder="Nhập tên chủ tài khoản"
            required
          />
        </div>

        <div className="form-group">
          <label>Địa chỉ</label>
          <input 
            type="text" 
            name="address" 
            value={formData.address}
            onChange={handleChange}
            placeholder="Nhập địa chỉ"
            required
          />
        </div>

        <div className="form-group">
          <label>Ngày phát hành thẻ</label>
          <input 
            type="date" 
            name="issueDate" 
            value={formData.issueDate}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Mã xác nhận</label>
          <input 
            type="text" 
            name="captcha" 
            value={formData.captcha}
            onChange={handleChange}
            placeholder="Nhập mã xác nhận"
            required
          />
        </div>
        
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : 'Thanh toán'}
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

export default PaymentDetail;