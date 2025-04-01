// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

import "./index.scss";

// import required modules
import { Autoplay, Pagination } from "swiper/modules";
import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "antd";
import { DoctorType } from "../../types/doctor";
import { CarouselProps } from "../../types/carousel";
import { Link } from "react-router-dom";
export default function DoctorCarousel({
  numberOfSlides = 1,
  autoplay = false,
}: CarouselProps) {
  const [poster, setPoster] = useState<DoctorType[]>([]);

  const fetchMovies = async () => {
    const response = await axios.get(
      "http://localhost:5199/api/Psychologist/all"
    );
    console.log();
    setPoster(response.data);
  };
  useEffect(() => {
    fetchMovies();
  }, []);
  return (
    <>
    <h1 className="title-doctor">Đội ngũ chuyên gia của BrainCare</h1>
    <Swiper
      slidesPerView={numberOfSlides}
      autoplay={{
        delay: 2500,
        disableOnInteraction: false,
      }}
      pagination={true}
      modules={autoplay ? [Pagination, Autoplay] : [Pagination]}
      className={`doctor-carousel ${numberOfSlides > 1 ? "multi" : ""}`}
    >
      {poster.map((doctor) => (
        <SwiperSlide key={doctor.id}>
          <div className="doctor-card">
            <div className="doctor-image">
              <img src={doctor.imgUrl} alt={doctor.name} />
            </div>
            <div className="doctor-info">
              <h2>{doctor.name}</h2>
              <p className="title">{doctor.specialization}</p>
              <p className="info">{doctor.description}</p>
              <Link to={`/booking-detail/${doctor.id}`}>
              <Button type="primary" className="doctor-button">
                Xem thêm
              </Button>
              </Link>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
    </>
  );
}
