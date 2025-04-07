import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AppointmentApi, OrderApi, AccountSurveyApi } from "../../services/SurveyApiService";
import { Loader2 } from "lucide-react";
import "./ServicesBarChart.scss";

type ServiceData = {
  name: string;
  count: number;
  fill: string;
};

export default function ServicesBarChart() {
  const [data, setData] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch data from all three services
        const [appointments, orders, surveys] = await Promise.all([
          AppointmentApi.getAll(),
          OrderApi.getAll(),
          AccountSurveyApi.getAllAccountSurvey(),
        ]);

        // Process the data to get counts
        const servicesData: ServiceData[] = [
          {
            name: "Đặt Lịch",
            count: Array.isArray(appointments) ? appointments.length : 0,
            fill: "#34d399", // Green
          },
          {
            name: "Đăng Ký Khoá Học",
            count: Array.isArray(orders) ? orders.length : 0,
            fill: "#f97316", // Orange
          },
          {
            name: "Thực Hiện Khảo Sát",
            count: Array.isArray(surveys) ? surveys.length : 0,
            fill: "#8b5cf6", // Purple
          },
        ];

        setData(servicesData);
        setError(null);
      } catch (err) {
        console.error("Error fetching service data:", err);
        setError("Failed to load service usage data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="services-card">
        <div className="services-card-header">
          <h3 className="services-card-title">Services Usage</h3>
          <p className="services-card-description">Loading service usage statistics...</p>
        </div>
        <div className="services-card-loading">
          <Loader2 className="services-card-spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="services-card">
        <div className="services-card-header">
          <h3 className="services-card-title">Services Usage</h3>
          <p className="services-card-description">Error loading data</p>
        </div>
        <div className="services-card-error">
          <p className="services-card-error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="services-card">
      <div className="services-card-header">
        <h3 className="services-card-title">SỐ LƯỢT SỬ DỤNG DỊCH VỤ</h3>
        <p className="services-card-description">Số liệu lấy từ đặt lịch, program và survey</p>
      </div>
      <div className="services-card-content">
        <div className="services-card-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value} uses`, "Count"]}
                labelFormatter={(label) => `Service: ${label}`}
              />
              <Legend />
              <Bar dataKey="count" name="Usage Count" radius={[4, 4, 0, 0]} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}