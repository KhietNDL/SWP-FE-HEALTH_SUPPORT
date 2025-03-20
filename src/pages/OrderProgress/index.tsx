import Header from "../../components/Header";
import Footer from "../../components/Footer";
import OrderProgress from "../../components/OrderProgress/OrderProgress";
import { ToastContainer } from "react-toastify";
function OrderProgressPage() {
  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <Header />
      <OrderProgress />
      <Footer />
    </div>
  );
}

export default OrderProgressPage;
