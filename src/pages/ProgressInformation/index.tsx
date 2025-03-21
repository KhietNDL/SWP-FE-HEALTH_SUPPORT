import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProgressInformation from "../../components/ProgressInformation/ProgressInformation";
import { ToastContainer } from "react-toastify";
function Progress() {
  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <Header />
      <ProgressInformation />
      <Footer />
    </div>
  );
}

export default Progress;
