import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProgressManagement from "../../components/ProgressManagement/ProgressManagement";
import { ToastContainer } from "react-toastify";
function ProgressManagePage() {
  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <Header />
      <ProgressManagement />
      <Footer />
    </div>
  );
}

export default ProgressManagePage;
