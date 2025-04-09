import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header";
import Footer from "../Footer";
import "./Program.scss";

interface ProgramItem {
  id: string;
  subscriptionName: string;
  description: string;
  price: number;
  duration: number;
  categoryName: string;
  psychologistName: string;
}

const API_URL = "http://localhost:5199/Subscription";
const MAX_DESCRIPTION_LENGTH = 80; // ✅ Tăng giới hạn ký tự mô tả để hiển thị rõ hơn

function Program() {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const navigate = useNavigate();

  async function fetchPrograms() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`API error, Status: ${response.status}`);
      }
      const data = await response.json();
      setPrograms(data);
    } catch (error) {
      console.error("API Fetch Error:", error);
    }
  }

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleViewMore = (id: string) => {
    navigate(`/danh-gia/${id}`); // Chuyển hướng sang trang chi tiết
  };

  return (
    <div className="program-page">
      <Header />

      <main className="program-content">
        {/* ✅ Tiêu đề lớn & mô tả */}
        <div className="program-hero">
          <h1 className="main-title">Khám phá các dịch vụ tâm lý</h1>
          <p className="sub-title">
            Chúng tôi cung cấp các chương trình đánh giá tâm lý chuyên sâu, phù hợp với mọi nhu cầu.
          </p>
        </div>

        {/* ✅ Hiển thị danh sách dịch vụ theo 2 cột */}
        <div className="services-grid">
          {programs.length === 0 ? (
            <p className="no-data">Hiện tại không có chương trình nào.</p>
          ) : (
            programs.map((program) => (
              <div key={program.id} className="service-card">
                <div className="service-header">
                  <h2>{program.subscriptionName}</h2>
                </div>

                <div className="service-description">
                  <p className="single-line">
                    <strong>Mô tả:</strong>{" "}
                    {program.description.length > MAX_DESCRIPTION_LENGTH
                      ? `${program.description.substring(0, MAX_DESCRIPTION_LENGTH)}...`
                      : program.description}
                  </p>
                  <p><strong>Giá:</strong> {program.price.toLocaleString()} VND</p>
                  <p><strong>Thời gian:</strong> {program.duration} Buổi</p>
                  <button className="view-more" onClick={() => handleViewMore(program.id)}>
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Program;
