import "./index.scss";
import {
  FacebookOutlined,
  InstagramOutlined,
  TikTokOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";
function Footer() {
  return (
    <div className="footer">
      <div className="footer__content">
        <div className="footer__section">
          <h3>Viện Tâm lý Giáo dục BrainCare</h3>
          <p>
            Địa chỉ: Tầng 7 Tòa nhà 59 Võ Chí Công, P. Nghĩa Đô, Q. Cầu Giấy,
            Tp. Hà Nội, Việt Nam
          </p>
        </div>
        <div className="footer__section">
          <h3>Liên hệ</h3>
          <p>Tổng đài tư vấn: 1900 3307</p>
          <p>Hotline: (024) 4455 3307</p>
          <p>Email: lienhe@braincare.vn</p>
        </div>
        <div className="footer__section">
          <h3>Website</h3>
          <ul>
            <li>
              <a
                href="https://braincare.vn"
                target="_blank"
                rel="noopener noreferrer"
              >
                braincare.vn
              </a>
            </li>
            <li>
              <a
                href="https://checkingcare.vn"
                target="_blank"
                rel="noopener noreferrer"
              >
                checkingcare.vn
              </a>
            </li>
            <li>
              <a
                href="https://phongkhamtamly.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                phongkhamtamly.com
              </a>
            </li>
            <li>
              <a
                href="https://phongkhamtamthan.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                phongkhamtamthan.com
              </a>
            </li>
          </ul>
        </div>
        <div className="footer__section">
          <h3>Kết nối với chúng tôi</h3>
          <div className="footer__icon">
          <a
              href="https://www.facebook.com/BrainCare.vn/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FacebookOutlined />
            </a>
            <a
              href="https://www.tiktok.com/@braincare.vn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <InstagramOutlined />
            </a>
            <a
              href="https://www.youtube.com/channel/UCHs5FSzv1vM91fqncrMGWsw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <YoutubeOutlined />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Footer;
