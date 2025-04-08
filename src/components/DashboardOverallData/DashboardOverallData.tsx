import { DashboardApiService } from '../../services/DashboardApiService';
import { useEffect, useState } from "react";

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
        <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
                <h3>Today's Orders</h3>
                <p style={{ fontSize: "24px", fontWeight: "bold" }}>{ordersToday}</p>
            </div>
            <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
                <h3>Total Account</h3>
                <p style={{ fontSize: "24px", fontWeight: "bold" }}>{totalAccounts}</p>
            </div>
        </div>
    );
};

export default DashboardOverallData;
