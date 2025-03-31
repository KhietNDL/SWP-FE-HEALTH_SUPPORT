import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/Store";
import { Modal } from "antd";
import Header from "../Header";
import Footer from "../Footer";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import "./ProgramDetail.scss";
import { useDispatch } from "react-redux";
import { setOrder } from "../../redux/features/orderSlice"; 

const UNSPLASH_ACCESS_KEY = "lKeuedjOVx61M-ThaCZzVH7Jctq7kukuK9BqecOzv-w"; // Thay bằng API Key của bạn

function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [programData, setProgramData] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState("");
  const accountId = useSelector((state: RootState) => state.user?.id);
  const dispatch = useDispatch();


  useEffect(() => {
    // Lấy dữ liệu chương trình từ API
    fetch(`http://localhost:5199/Subscription/${id}`)
      .then((res) => res.json())
      .then((data) => setProgramData(data))
      .catch((err) => console.error("Lỗi tải dữ liệu:", err));

    // Lấy hình ảnh ngẫu nhiên từ Unsplash API
    fetch(`https://api.unsplash.com/photos/random?query=education,children&client_id=${UNSPLASH_ACCESS_KEY}`)
      .then((res) => res.json())
      .then((data) => setImageUrl(data.urls.regular))
      .catch(() => setImageUrl("/default-image.jpg"));
  }, [id]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
    
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleRegister = () => {
    console.log("Trước khi mở modal:", programData); // Kiểm tra state trước khi mở modal
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    console.log("Dữ liệu trước khi đăng ký:", programData);
    if (!programData?.id) {
      console.error("❌ Lỗi: subscriptionId bị thiếu.");
      return;
    }
    if (!accountId) {
      console.error("❌ Lỗi: accountId không hợp lệ.");
      return;
    }
  
    const orderData = {
      subscriptionId: programData.id,
      accountId: accountId,
      quantity: 1,
    };
  
    console.log("Order Data:", orderData);
  
    try {
      // Gửi request tạo đơn hàng
      const response = await fetch("http://localhost:5199/Order/Create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi API: ${response.status} - ${errorText}`);
      }
  
      console.log("✅ Đơn hàng tạo thành công, đang lấy orderId...");
  
      // Gọi API để lấy đơn hàng mới nhất của tài khoản
      const orderResponse = await fetch(`http://localhost:5199/Order?accountId=${accountId}`);
      if (!orderResponse.ok) {
        throw new Error(`Lỗi lấy đơn hàng: ${orderResponse.status}`);
      }
  
      const orders = await orderResponse.json();
      if (orders.length === 0) {
        throw new Error("Không tìm thấy đơn hàng nào.");
      }
  
      orders.sort((a: any, b: any) => new Date(b.createAt).getTime() - new Date(a.createAt).getTime()); 
      const latestOrder = orders[0];// Giả sử đơn mới nhất là đơn cuối cùng
      console.log("✅ Lấy được orderId:", latestOrder.id);
  
      dispatch(setOrder(latestOrder));
  
      setIsModalOpen(false);
      navigate(`/order-detail/${latestOrder.id}`, {
        state: { subscriptionId: programData.id }, // Truyền subscriptionId qua state
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Lỗi không xác định";
      console.error("❌ Lỗi:", errMessage);
      alert(`Có lỗi xảy ra! Chi tiết: ${errMessage}`);
    }
  };
  
  
  

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  if (!programData) return <p>Loading...</p>;

  return (
    <div className="program-detail-page">
      <Header />
      <main className="program-detail-content">
        <div className="program-detail-hero">
          <img src={imageUrl} alt="Program" />
        </div>

        <div className="program-title">
          <h1>{programData.subscriptionName}</h1>
          <p>Chuyên gia: {programData.psychologistName}</p>
          <p>Danh mục: {programData.categoryName}</p>
        </div>

        <div className="program-description">
          <p>{programData.description}</p>
        </div>

        <div className="program-detail-sections">
          <div className="detail-section">
            <div className="section-header" onClick={() => toggleSection("purpose")}>
              <h2>Mục đích</h2>
              {expandedSections.includes("purpose") ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {expandedSections.includes("purpose") && (
              <div className="section-content">
                <p>{programData.purpose}</p>
              </div>
            )}
          </div>

          <div className="detail-section">
            <div className="section-header" onClick={() => toggleSection("criteria")}>
              <h2>Các chỉ số đánh giá</h2>
              {expandedSections.includes("criteria") ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {expandedSections.includes("criteria") && (
              <div className="section-content">
                <p>{programData.criteria}</p>
              </div>
            )}
          </div>

          <div className="detail-section">
            <div className="section-header" onClick={() => toggleSection("focusGroup")}>
              <h2>Nhóm đối tượng</h2>
              {expandedSections.includes("focusGroup") ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {expandedSections.includes("focusGroup") && (
              <div className="section-content">
                <p>{programData.focusGroup}</p>
              </div>
            )}
          </div>

          <div className="detail-section">
            <div className="section-header" onClick={() => toggleSection("assessmentTool")}>
              <h2>Công cụ đánh giá</h2>
              {expandedSections.includes("assessmentTool") ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {expandedSections.includes("assessmentTool") && (
              <div className="section-content">
                <p>{programData.assessmentTool}</p>
              </div>
            )}
          </div>
        </div>

        <div className="program-detail-footer">
          <p className="duration">Thời gian liệu trình: {programData.duration} ngày</p>
          <p className="price">Giá: {programData.price.toFixed(2)}VND</p>
          <button className="register-button" onClick={handleRegister}>
            Đăng ký
          </button>
          <button
            className="progress-button"
            onClick={() =>
              navigate(`/progress-program?subscriptionName=${encodeURIComponent(programData.subscriptionName)}`)
            }
          >
            Xem tiến trình
          </button>
        </div>

        <Modal
          title="Xác nhận đăng ký"
          open={isModalOpen}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          okText="Đồng ý"
          cancelText="Hủy"
        >
          <p>Bạn có chắc là sẽ mua gói này không?</p>
        </Modal>
      </main>
      <Footer />
    </div>
  );
}

export default ProgramDetail;
