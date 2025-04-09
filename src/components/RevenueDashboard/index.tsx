import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartEvent,
  ActiveElement,
} from 'chart.js';
// Thêm Modal vào import từ antd
import { Select, Spin, Alert, Card, List, Button, Typography, Modal } from 'antd';
import { message as toast } from 'antd'; // Sử dụng message của Antd làm toast

const { Text } = Typography;

// Đăng ký Chart.js (giữ nguyên)
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

// Interfaces (giữ nguyên)
interface RevenueStatsResponse {
  year: number;
  monthlyRevenue: { [month: string]: number };
  monthlySubscriptions: { [month: string]: { [programName: string]: number } };
}
interface MonthlyDetail { [programName: string]: number; }

const RevenueDashboard: React.FC = () => {
  const [totalRevenueData, setTotalRevenueData] = useState<any>({ labels: [], datasets: [] });
  const [detailedRevenueData, setDetailedRevenueData] = useState<{ [month: string]: MonthlyDetail } | null>(null);
  const [selectedMonthDetail, setSelectedMonthDetail] = useState<MonthlyDetail | null>(null);
  const [selectedMonthLabel, setSelectedMonthLabel] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ----- State mới cho Modal -----
  const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);
  // -----------------------------

  const chartRef = useRef<ChartJS<'line'>>(null);

  const formatCurrency = (value: number): string => {
    return `${value.toLocaleString('vi-VN')} VNĐ`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setTotalRevenueData({ labels: [], datasets: [] });
      setDetailedRevenueData(null);
      setSelectedMonthDetail(null); // Reset khi fetch năm mới
      setSelectedMonthLabel(null);  // Reset khi fetch năm mới
      setIsDetailModalVisible(false); // Đóng modal nếu đang mở khi đổi năm

      try {
        const apiUrl = `https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net/api/Dashboard/stats?year=${selectedYear}`;
        console.log(`Workspaceing revenue data from: ${apiUrl}`);
        const response = await axios.get<RevenueStatsResponse>(apiUrl);
        const statsData = response.data;

        if (statsData?.monthlyRevenue && statsData?.monthlySubscriptions) {
            const yearFromApi = statsData.year;
            const totalMonthlyRevenue = statsData.monthlyRevenue;
            const detailedMonthlyData = statsData.monthlySubscriptions;

            const months = Array.from({ length: 12 }, (_, i) => i + 1);
            const labels = months.map(m => `Tháng ${m}`);
            const totalRevenueCounts = months.map(m => totalMonthlyRevenue[String(m)] ?? 0);

            setTotalRevenueData({
                labels: labels,
                datasets: [ { /* ... dataset config ... */
                    label: `Tổng doanh thu (${yearFromApi})`,
                    data: totalRevenueCounts,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true, tension: 0.1, pointBackgroundColor: 'rgb(75, 192, 192)', pointRadius: 4, pointHoverRadius: 6,
                }, ],
            });
            setDetailedRevenueData(detailedMonthlyData);
        } else {
            setError("Không nhận được dữ liệu doanh thu hợp lệ.");
        }
      } catch (err: any) {
        console.error("Error fetching revenue data:", err);
        let errorMsg = "Không thể tải dữ liệu doanh thu.";
        if (err.response) errorMsg += ` (Lỗi ${err.response.status})`;
        else if (err.request) errorMsg = "Không nhận được phản hồi từ máy chủ.";
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedYear]);

  // Xử lý click: Cập nhật data và MỞ MODAL
  const handleChartClick = (event: ChartEvent) => {
    const chart = chartRef.current;
    if (!chart) return;
    const elements = chart.getElementsAtEventForMode(event.native as MouseEvent, 'nearest', { intersect: true }, true);

    if (elements.length > 0) {
      const element = elements[0] as ActiveElement;
      const monthIndex = element.index;
      const monthNumber = monthIndex + 1;
      const monthKey = String(monthNumber);

      if (detailedRevenueData && detailedRevenueData[monthKey]) {
        setSelectedMonthDetail(detailedRevenueData[monthKey]);
        setSelectedMonthLabel(`Tháng ${monthNumber}, ${selectedYear}`);
        // ----- Mở Modal -----
        setIsDetailModalVisible(true);
        // ---------------------
      } else {
        setSelectedMonthDetail(null);
        setSelectedMonthLabel(null);
        setIsDetailModalVisible(false); // Đảm bảo modal đóng nếu không có data
        toast.info(`Không có dữ liệu chi tiết cho Tháng ${monthNumber}.`);
      }
    }
  };

  // ----- Hàm xử lý đóng Modal -----
  const handleModalClose = () => {
    setIsDetailModalVisible(false);
    // Không cần reset selectedMonthDetail/Label ở đây nếu dùng destroyOnClose
    // Hoặc reset nếu muốn:
    // setSelectedMonthDetail(null);
    // setSelectedMonthLabel(null);
  };
  // ------------------------------

  const chartOptions: any = { /* ... giữ nguyên options và onClick ... */
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index' as const, intersect: false },
      plugins: { legend: { position: 'top' as const }, title: { display: true, text: `Biểu đồ tổng doanh thu theo tháng năm ${selectedYear}`, font: { size: 18 } },
        tooltip: { callbacks: { label: (context:any) => `${context.dataset.label || ''}: ${formatCurrency(context.parsed.y)}` } } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Tổng doanh thu (VNĐ)' }, ticks: { callback: (v:any) => typeof v === 'number' ? (v >= 1e6 ? (v / 1e6) + 'tr' : (v >= 1e3 ? (v / 1e3) + 'k' : v)) : v } }, x: { title: { display: true, text: 'Tháng' } } },
      onClick: handleChartClick,
  };

  const generateYearOptions = () => { /* ... giữ nguyên ... */
     const years = []; for (let i = 0; i < 5; i++) { years.push(currentYear - i); } return years.map(year => ({ value: year, label: `${year}` }));
  };

  return (
    <div className="dashboard-container revenue-dashboard" style={{ padding: '20px' }}>
      

      {/* Bộ lọc chọn năm */}
      <div className="year-selector-container" style={{ marginBottom: '20px', textAlign: 'right' }}>
        <label htmlFor="year-select-revenue" style={{ marginRight: '8px' }}>Chọn năm:</label>
        <Select id="year-select-revenue" value={selectedYear} style={{ width: 120 }} onChange={(value) => setSelectedYear(value)} options={generateYearOptions()} loading={isLoading} />
      </div>

      {/* Biểu đồ đường */}
      <Card title="Tổng quan doanh thu" style={{ marginBottom: '20px' }} className="chart-card">
          <div className="chart-area" style={{ position: 'relative', height: '400px', width: '100%'}}>
             {/* Placeholder states (loading, error, no data) */}
             {isLoading && <div className="placeholder-content loading-state" style={{ /*...*/ position: 'absolute', top:0, left:0, width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center', background:'rgba(255,255,255,0.8)', zIndex:10 }}><Spin size="large" tip="Đang tải dữ liệu..." /></div>}
             {error && !isLoading && <div className="placeholder-content error-state" style={{ /*...*/ position: 'absolute', top:0, left:0, width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center', background:'rgba(255,255,255,0.8)', zIndex:10 }}><Alert message="Lỗi" description={error} type="error" showIcon /></div>}
             {!isLoading && !error && totalRevenueData.labels?.length > 0 && <Line ref={chartRef} options={chartOptions} data={totalRevenueData} />}
             {!isLoading && !error && !totalRevenueData.labels?.length && <div className="placeholder-content no-data-state" style={{ /*...*/ position: 'absolute', top:0, left:0, width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center', background:'rgba(255,255,255,0.8)', zIndex:10 }}><p>Không có dữ liệu doanh thu cho năm {selectedYear}.</p></div>}
          </div>
      </Card>

       {/* ----- THAY THẾ CARD CHI TIẾT BẰNG MODAL ----- */}
       <Modal
          title={selectedMonthLabel ? `Chi tiết doanh thu - ${selectedMonthLabel}` : "Chi tiết doanh thu"}
          open={isDetailModalVisible} // Trạng thái hiển thị
          onCancel={handleModalClose} // Hàm xử lý khi đóng
          footer={ // Chỉ hiển thị nút Đóng
             <Button key="close" onClick={handleModalClose}>
                 Đóng
             </Button>
          }
          destroyOnClose // Tự động hủy state bên trong khi đóng
          width={650} // Tùy chỉnh độ rộng nếu cần
       >
           {selectedMonthDetail ? ( // Chỉ render nội dung khi có data
               <>
                  {Object.keys(selectedMonthDetail).length > 0 ? (
                      <List
                          size="small"
                          dataSource={Object.entries(selectedMonthDetail)}
                          renderItem={([programName, revenue]) => (
                              <List.Item>
                                  <Text>{programName}</Text>
                                  <Text strong>{formatCurrency(revenue)}</Text>
                              </List.Item>
                          )}
                          style={{ maxHeight: '400px', overflowY: 'auto' }} // Thêm scroll nếu list quá dài
                      />
                  ) : (
                      <p style={{ textAlign: 'center', padding: '20px 0' }}>Không có dữ liệu doanh thu chi tiết cho tháng này.</p>
                  )}
               </>
           ) : (
               // Có thể hiển thị loading nhỏ bên trong modal nếu cần,
               // nhưng thường modal chỉ mở khi đã có data sẵn
               <Spin tip="Đang tải chi tiết..." />
           )}
       </Modal>
       {/* ---------------------------------------------- */}

    </div>
  );
};

export default RevenueDashboard;