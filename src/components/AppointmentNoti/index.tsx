import React, { useEffect, useState } from "react";
import axios from "axios";
import "./index.scss";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/Store";
import { Appointment } from "../../types/Appointment";

const Notification: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (user.id) {
      console.log(user.id);
      axios.get(`https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net/Appointment/by-name/${user?.fullname}/Psychologist`)
        .then(response => {
          setAppointments(response.data.filter((appt: Appointment) => appt.status === "pending"));
        })
        .catch(error => console.error("Error fetching appointments:", error));
    }
  }, [user.id]);

  const confirmAppointment = (id: string) => {
    const appointmentToUpdate = appointments.find(appt => appt.id === id);
    if (!appointmentToUpdate) return;
  
    const updatedAppointment = {
      accountId: appointmentToUpdate.accountId,
      psychologistId: appointmentToUpdate.psychologistId,
      content: appointmentToUpdate.content,
      appointmentDate: appointmentToUpdate.appointmentDate,
      status: "approved"
    };
  
    axios.put(`https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net/Appointment/${id}`, updatedAppointment)
      .then(() => {
        // Gọi lại API để lấy danh sách cuộc hẹn mới nhất
        axios.get(`https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net/Appointment/by-name/${user?.fullname}/Psychologist`)
          .then(response => {
            setAppointments(response.data.filter((appt: Appointment) => appt.status === "pending"));
          })
          .catch(error => console.error("Error fetching updated appointments:", error));
      })
      .catch(error => console.error("Error confirming appointment:", error));
  };
  

  const rejectAppointment = (id: string) => {
    axios.delete(`https://healthsupportwebapp-edf2hybhcah3e7hr.southeastasia-01.azurewebsites.net/Appointment/${id}`)
      .then(() => {
        setAppointments(prev => prev.filter(appt => appt.id !== id));
      })
      .catch(error => console.error("Error rejecting appointment:", error));
  };

  return (
    <div className="notification-container">
      <h2>Appointment Notifications</h2>
      {appointments.length === 0 ? (
        <p>No pending appointments.</p>
      ) : (
        appointments.map(appt => (
          <div key={appt.id} className="notification-card">
            <h3>{appt.account.fullname}</h3>
            <p>Email: {appt.account.email}</p>
            <p>Phone: {appt.account.phone}</p>
            <p>Address: {appt.account.address}</p>
            <p>Content: {appt.content}</p>
            <p>Appointment Date: {new Date(appt.appointmentDate).toLocaleString()}</p>
            <div className="button-group">
            <button onClick={() => confirmAppointment(appt.id)}>Confirm</button>
            <button onClick={() => rejectAppointment(appt.id)}>Reject</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Notification;
