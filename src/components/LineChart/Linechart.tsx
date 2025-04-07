import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './LineChart.scss';

interface SubscriptionData {
  month: string;
  totalPrograms: number;
  totalRevenue: number;
}

const SubscriptionLineChart: React.FC = () => {
  const [data, setData] = useState<SubscriptionData[]>([
    { month: 'Jan', totalPrograms: 0.5, totalRevenue: 75000 },
    { month: 'Feb', totalPrograms: 1.5, totalRevenue: 97500 },
    { month: 'Mar', totalPrograms: 1.0, totalRevenue: 82500 },
    { month: 'Apr', totalPrograms: 2.0, totalRevenue: 105000 },
    { month: 'May', totalPrograms: 1.5, totalRevenue: 90000 },
    { month: 'Jun', totalPrograms: 2.5, totalRevenue: 112500 }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data from APIs...');
        
        // Correct URLs with the /api prefix as originally mentioned
        const subscriptionsUrl = 'http://localhost:5199/api/Dashboard/subscriptions/monthly';
        const revenueUrl = 'http://localhost:5199/api/Dashboard/revenue/monthly';
        
        console.log('Subscription URL:', subscriptionsUrl);
        console.log('Revenue URL:', revenueUrl);
        
        // Fetch subscription data
        const subscriptionsResponse = await fetch(subscriptionsUrl);
        // Fetch revenue data
        const revenueResponse = await fetch(revenueUrl);
        
        console.log('Subscription response status:', subscriptionsResponse.status);
        console.log('Revenue response status:', revenueResponse.status);
        
        if (!subscriptionsResponse.ok || !revenueResponse.ok) {
          console.error('Failed to fetch data');
          return; // Keep using sample data
        }
        
        const subscriptionsData = await subscriptionsResponse.json();
        const revenueData = await revenueResponse.json();
        
        console.log('Subscription data:', subscriptionsData);
        console.log('Revenue data:', revenueData);
        
        // Map and combine data from both APIs
        const combinedData = subscriptionsData.map((sub: any) => {
          // Find matching revenue data for the month
          const matchingRevenue = revenueData.find((rev: any) => rev.month === sub.month) || { totalRevenue: 0 };
          
          return {
            month: sub.monthName,
            totalPrograms: sub.totalSubscriptions,
            totalRevenue: matchingRevenue.totalRevenue
          };
        });
        
        console.log('Combined data:', combinedData);
        
        if (combinedData && combinedData.length > 0) {
          setData(combinedData);
          console.log('Chart data updated successfully');
        } else {
          console.warn('Combined data is empty or invalid');
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
        // Keep using sample data on error
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="subscription-line-chart">
      <h2>Subscription Overview</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" 
            label={{ value: 'Total Programs', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => Math.floor(value).toString()}
            domain={[0, 'auto']}
            allowDecimals={false}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            domain={[1000000, 'auto']} 
            label={{ value: 'Total Revenue (VNĐ)', angle: 90, position: 'insideRight' }} 
          />
          
          <Tooltip 
            formatter={(value, name) => [
              name === 'totalPrograms' ? value + ' Programs' : 
              new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))
            ]}
          />
          <Legend />
          
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="totalPrograms" 
            stroke="#8884d8" 
            activeDot={{ r: 8 }} 
            name="Total Programs"
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="totalRevenue" 
            stroke="#82ca9d" 
            name="Total Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubscriptionLineChart;