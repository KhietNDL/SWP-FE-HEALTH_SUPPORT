import { DashboardApiService } from '../../services/DashboardApiService';
import { useEffect, useState } from "react";
import './DashboardOverallData.scss';

const DashboardOverallData = () => {
    const [ordersToday, setOrdersToday] = useState(0);
    const [totalAccounts, setTotalAccounts] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const orders = await DashboardApiService.getOrdersToday();
                const accounts = await DashboardApiService.getTotalAccount();
                setOrdersToday(orders);
                setTotalAccounts(accounts);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="dashboard-overall-data">
            <div className="dashboard-card">
                <div className="dashboard-card-header">
                    <span className="dashboard-icon">📦</span>
                    <h3>Today's Orders</h3>
                </div>
                <p className="dashboard-value">{ordersToday}</p>
            </div>
            <div className="dashboard-card">
                <div className="dashboard-card-header">
                    <span className="dashboard-icon">👥</span>
                    <h3>Total Accounts</h3>
                </div>
                <p className="dashboard-value">{totalAccounts}</p>
            </div>
        </div>
    );
};

export default DashboardOverallData;
