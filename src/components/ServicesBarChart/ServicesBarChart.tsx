import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2, ChevronDown } from "lucide-react";
import { DashboardApiService } from "../../services/DashboardApiService"; // Import service
import "./ServicesBarChart.scss";

// Define the yearly data structure based on the API response
type YearlyData = {
  year: number;
  appointmentMonthlyCounts: Record<string, number>;
  orderMonthlyCounts: Record<string, number>;
  surveyMonthlyCounts: Record<string, number>;
};

// Define the monthly chart data structure
type MonthlyChartData = {
  month: string;
  appointments: number;
  programs: number;
  surveys: number;
};

export default function ServicesBarChart() {
  const [apiData, setApiData] = useState<YearlyData[]>([]);
  const [chartData, setChartData] = useState<MonthlyChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Month names in Vietnamese
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch data using DashboardApiService
        const yearlyData: YearlyData[] = await DashboardApiService.getTotalMonthly();
        setApiData(yearlyData);

        // Extract available years from the data
        const years = yearlyData.map((data) => data.year);
        setAvailableYears(years.length > 0 ? years.sort((a, b) => b - a) : [new Date().getFullYear()]);

        // Set selected year to the most recent year in the data, or current year if no data
        const mostRecentYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
        setSelectedYear(mostRecentYear);

        setError(null);
      } catch (err: any) {
        console.error("Error fetching service data:", err);

        // Provide more specific error message
        if (err.message === "Failed to fetch") {
          setError("Không thể kết nối đến máy chủ API. Vui lòng kiểm tra máy chủ.");
        } else {
          setError(`Không thể tải dữ liệu: ${err.message}`);
        }

        // Generate sample data for the current year
        const sampleData = generateSampleYearlyData();
        setApiData(sampleData);

        // Extract available years from the sample data
        const years = sampleData.map((data) => data.year);
        setAvailableYears(years);

        // Set selected year to the most recent year in the sample data
        const mostRecentYear = Math.max(...years);
        setSelectedYear(mostRecentYear);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update chart data when selected year changes or API data changes
  useEffect(() => {
    if (apiData.length > 0) {
      const yearData = apiData.find((data) => data.year === selectedYear);

      if (yearData) {
        const monthlyData = processMonthlyData(yearData);
        setChartData(monthlyData);
      } else {
        // If no data for selected year, show empty data
        setChartData(generateEmptyMonthlyData());
      }
    }
  }, [selectedYear, apiData]);

  // Function to process monthly data for the chart
  const processMonthlyData = (yearData: YearlyData): MonthlyChartData[] => {
    const monthlyChartData: MonthlyChartData[] = [];

    // Create data for all 12 months
    for (let i = 1; i <= 12; i++) {
      const monthKey = i.toString();

      monthlyChartData.push({
        month: monthNames[i - 1],
        appointments: yearData.appointmentMonthlyCounts[monthKey] || 0,
        programs: yearData.orderMonthlyCounts[monthKey] || 0,
        surveys: yearData.surveyMonthlyCounts[monthKey] || 0,
      });
    }

    return monthlyChartData;
  };

  // Generate empty monthly data (all zeros)
  const generateEmptyMonthlyData = (): MonthlyChartData[] => {
    return monthNames.map((month) => ({
      month,
      appointments: 0,
      programs: 0,
      surveys: 0,
    }));
  };

  // Generate sample yearly data for demonstration
  const generateSampleYearlyData = (): YearlyData[] => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1, currentYear - 2];

    return years.map((year) => {
      const appointmentMonthlyCounts: Record<string, number> = {};
      const orderMonthlyCounts: Record<string, number> = {};
      const surveyMonthlyCounts: Record<string, number> = {};

      // Generate random data for each month
      for (let month = 1; month <= 12; month++) {
        const monthKey = month.toString();
        appointmentMonthlyCounts[monthKey] = Math.floor(Math.random() * 20) + 1;
        orderMonthlyCounts[monthKey] = Math.floor(Math.random() * 15) + 1;
        surveyMonthlyCounts[monthKey] = Math.floor(Math.random() * 10) + 1;
      }

      return {
        year,
        appointmentMonthlyCounts,
        orderMonthlyCounts,
        surveyMonthlyCounts,
      };
    });
  };

  if (loading) {
    return (
      <div className="services-card">
        <div className="services-card-header">
          <h3 className="services-card-title">Sử dụng dịch vụ hàng tháng</h3>
          <p className="services-card-description">Đang tải dữ liệu thống kê...</p>
        </div>
        <div className="services-card-loading">
          <Loader2 className="services-card-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="services-card">
      <div className="services-card-header">
        <h3 className="services-card-title">Sử dụng dịch vụ hàng tháng</h3>
        <p className="services-card-description">
          {error
            ? "Hiển thị dữ liệu mẫu do lỗi kết nối API"
            : "Số lượng lịch hẹn, chương trình và khảo sát theo tháng"}
        </p>
        {error && <p className="services-card-error-message">{error}</p>}
      </div>
      <div className="services-card-content">
        <div className="year-selector">
          <span className="year-selector-label">Năm:</span>
          <div className="year-dropdown">
            <button className="year-dropdown-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
              {selectedYear}
              <ChevronDown
                className={`year-dropdown-icon ${dropdownOpen ? "year-dropdown-icon-open" : ""}`}
                size={16}
              />
            </button>

            {dropdownOpen && (
              <div className="year-dropdown-menu">
                {availableYears.map((year) => (
                  <div
                    key={year}
                    className={`year-dropdown-item ${year === selectedYear ? "year-dropdown-item-selected" : ""}`}
                    onClick={() => {
                      setSelectedYear(year);
                      setDropdownOpen(false);
                    }}
                  >
                    {year}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="services-card-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => {
                  let displayName = "";
                  switch (name) {
                    case "appointments":
                      displayName = "Lịch hẹn";
                      break;
                    case "programs":
                      displayName = "Chương trình";
                      break;
                    case "surveys":
                      displayName = "Khảo sát";
                      break;
                    default:
                      displayName = String(name);
                  }
                  return [`${value} lần`, displayName];
                }}
              />
              <Legend />
              <Bar dataKey="appointments" name="Lịch hẹn" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="programs" name="Chương trình" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="surveys" name="Khảo sát" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}