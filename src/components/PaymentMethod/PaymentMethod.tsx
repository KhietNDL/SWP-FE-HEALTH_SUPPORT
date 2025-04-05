import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PaymentMethod.scss';

// Import your bank logos
import vcbLogo from '../../images/vcb.png';
import mbLogo from '../../images/mb.jpg';
import acbLogo from '../../images/acb.png';
import bidvLogo from '../../images/bidv.png';
import tpbLogo from '../../images/tpb.png';
import agbLogo from '../../images/agb.jpg';
import scbLogo from '../../images/scb.jpg';
import vabLogo from '../../images/vab.jpg';
import vnpayheader from '../../images/vnpayheader.jpg';
import vnpayqr from '../../images/vnpayqr.jpg';
import bankIcon from '../../images/banklogo.jpg';
import creditcard from '../../images/credit.png';
import walletIcon from '../../images/vnpay4.jpg';
import secureIcon from '../../images/secure.jpg';

interface Bank {
  id: string;
  name: string;
  logo: string;
}

const PaymentMethod: React.FC = () => {
  const [isBanksOpen, setIsBanksOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get orderId and price from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const price = searchParams.get('price');

  const banks: Bank[] = [
    { id: 'vcb', name: 'VCB', logo: vcbLogo },
    { id: 'mb', name: 'MB', logo: mbLogo },
    { id: 'acb', name: 'ACB', logo: acbLogo },
    { id: 'bidv', name: 'BIDV', logo: bidvLogo },
    { id: 'tpb', name: 'TPB', logo: tpbLogo },
    { id: 'agb', name: 'AGB', logo: agbLogo },
    { id: 'scb', name: 'SCB', logo: scbLogo },
    { id: 'vab', name: 'VAB', logo: vabLogo },
  ];
  
  const toggleBanks = (): void => {
    setIsBanksOpen(!isBanksOpen);
  };
  
  const handleBankSelection = (bankId: string): void => {
    // Navigate to payment details page with the selected bank, orderId and price
    navigate(`/payment-detail/${bankId}?orderId=${orderId}&price=${price}`);
  };

  const handleBack = () => {
    navigate(`/order-detail/${orderId}`);
  };
  
  return (
    <div className="payment-page-wrapper">
      <div className="payment-container">
        <div className="header">
          <div className="back-button" onClick={handleBack}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Quay lại
          </div>
          <img src={vnpayheader} alt="VNPAY" />
          <div className="language-selector">Vietnam</div>
        </div>
        
        <div className="title">Chọn phương thức thanh toán</div>
        
        <div className="payment-options">
          <div className="option">
            <div className="option-text">
              Ứng dụng thanh toán hỗ trợ <span className="vnpay-text">VNPAY</span><sup>QR</sup>
            </div>
            <img className="option-icon" src={vnpayqr} alt="QR" />
          </div>
          
          <div className="option" onClick={toggleBanks}>
            <div className="option-text">Thẻ nội địa và tài khoản ngân hàng</div>
            <img className="option-icon" src={bankIcon} alt="Bank" />
          </div>
          
          <div className={`banks-dropdown ${isBanksOpen ? 'open' : ''}`}>
            {banks.map((bank) => (
              <div
                key={bank.id}
                className="bank-option"
                onClick={() => handleBankSelection(bank.id)}
              >
                <img src={bank.logo} alt={bank.name} />
                <div className="bank-name">{bank.name}</div>
              </div>
            ))}
          </div>
          
          <div className="option">
            <div className="option-text">Thẻ thanh toán quốc tế</div>
            <div className="credit-card-icons">
              <img src={creditcard} alt="Credit Cards" />
            </div>
          </div>
          
          <div className="option">
            <div className="option-text">Ví điện tử <span className="vnpay-text">VNPAY</span></div>
            <img className="option-icon" src={walletIcon} alt="Wallet" />
          </div>
        </div>
        
        <div className="footer">
          <div className="contact">
            <a href="tel:1900.5555.77" className="phone">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
              </svg>
              1900.5555.77
            </a>
            <a href="mailto:hotrovnpay@vnpay.vn" className="email">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
              </svg>
              hotrovnpay@vnpay.vn
            </a>
          </div>
          <div className="security">
            <img src={secureIcon} alt="Secure Payment" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;