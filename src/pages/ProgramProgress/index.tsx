import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProgramProgress from "../../components/ProgramProgress/ProgramProgress";
import { ToastContainer } from "react-toastify";
function ProgressPage() {
  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <Header />
      <ProgramProgress />
      <Footer />
    </div>
  );
}

export default ProgressPage;
