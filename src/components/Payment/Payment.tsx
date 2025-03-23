import React, { useState } from "react";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import "./Payment.scss";
import Momoqr from "../../images/momoqr.jpg";

Modal.setAppElement("#root");

const Payment: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Chỉ lưu phương thức, không mở modal
  const handlePaymentMethodChange = (method: string) => {
    setSelectedMethod(method);
  };

  // Chỉ mở modal khi bấm "Pay Now"
  const handlePayNow = () => {  
    if (!selectedMethod) {
      alert("Vui lòng chọn phương thức thanh toán!"); // Cảnh báo nếu chưa chọn
      return;
    }
    setIsOpen(true);
  };

  return (
    <div className="payment-page">
      <h2>PAYMENT DETAILS</h2>
      <div className="payment-container">
        <div className="payment-form">
          <div className="payment-methods">
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="Momo"
                onChange={() => handlePaymentMethodChange("Momo")}
              />
              <span>Momo</span>
            </label>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="CreditCard"
                onChange={() => handlePaymentMethodChange("CreditCard")}
              />
              <span>Credit Card</span>
            </label>
          </div>

          <div className="payment-details">
            {selectedMethod === "CreditCard" && (
              <div className="credit-card-details">
                <label>
                  CREDIT CARD NUMBER
                  <input type="text" placeholder="0000 0000 0000 ****" />
                </label>
                <label>
                  CVV CODE
                  <input type="text" placeholder="***" />
                </label>
                <label>
                  EXPIRY DATE
                  <input type="text" placeholder="MM / YY" />
                </label>
              </div>
            )}

            {selectedMethod === "Momo" && (
              <div className="qr-code-container">
                <h3>Scan the QR code to pay with Momo</h3>
                <img src={Momoqr} alt="QR code for Momo" />
              </div>
            )}
          </div>

          {/* Chỉ mở modal khi bấm Pay Now */}
          <button className="payment-button" onClick={handlePayNow}>
            Pay Now
          </button>
        </div>
      </div>

      {/* Popup Modal */}
      <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)} className="modal">
        <div className="modal-content">
          <h2>🎉 Thanh Toán Thành Công!</h2>
          <p>Cảm ơn bạn đã thanh toán. Đơn hàng của bạn sẽ sớm được xử lý.</p>
          <button onClick={() => navigate("/")}>OK</button>
        </div>
      </Modal>
    </div>
  );
};

export default Payment;
