import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "antd";
import { DoctorType } from "../../types/doctor";
import "./index.scss";
import { Link } from "react-router-dom";
function DoctorList() {
  const [poster, setPoster] = useState<DoctorType[]>([]);

  const fetchDoctor = async () => {
    const response = await axios.get(
      "http://localhost:5199/api/Psychologist/all"
    );
    console.log();
    setPoster(response.data);
  };
  useEffect(() => {
    fetchDoctor();
  }, []);
  return (
    <div className="doctor-list">
      <h1 className="title">Đội ngũ chuyên gia của BrainCare</h1>
      {poster.map((doctor) => (
        <div className="doctor-card">
          <div className="doctor-image">
            <img src={doctor.poster_path} alt={doctor.name} />
          </div>
          <div className="doctor-info">
            <h2>{doctor.name}</h2>
            <p className="title">{doctor.role}</p>
            <p className="info">{doctor.specialization}</p>
            <Link to={`/booking-detail/${doctor.id}`}>
            <Button type="primary" className="doctor-button">
              Xem thêm
            </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DoctorList;
