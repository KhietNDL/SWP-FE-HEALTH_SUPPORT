import { useEffect } from "react";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import TakeSurvey from "../../components/TakeSurvey/TakeSurvey";

function TakeSurveyPage() {
  useEffect(() => {
    const hasRefreshed = sessionStorage.getItem("hasRefreshed");
    if (!hasRefreshed) {
      sessionStorage.setItem("hasRefreshed", "true");
      window.location.reload();
    }
  }, []);

  return (
    <div>
      <header>
        <Header />
      </header>
      <main>
        <TakeSurvey />
      </main>
      <footer>
        <Footer />
      </footer>
    </div>
  );
}

export default TakeSurveyPage;
