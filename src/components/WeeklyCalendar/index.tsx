import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Event } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

import axios from "axios";
import "./index.scss";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/Store";
import { Modal } from "antd";

const localizer = momentLocalizer(moment);

const WeeklySchedule: React.FC = () => {
  const user = useSelector((state: RootState) => state.user);
  const [appointments, setAppointments] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    axios
      .get(
        `http://localhost:5199/Appointment/by-name/${user?.fullname}/Psychologist`
      )
      .then((response) => {
        const approvedAppointments = response.data
          .filter((appt: any) => appt.status !== "pending")
          .map((appt: any) => ({
            id: appt.id,
            title: `${appt.account?.fullname || "Unknown"} - ${
              appt.content || "Approved Appointment"
            }`,
            start: new Date(appt.appointmentDate),
            end: new Date(
              moment(appt.appointmentDate).add(1, "hour").toISOString()
            ),
            resource: appt,
          }));

        setAppointments(approvedAppointments);
      })
      .catch((error) =>
        console.error("Error fetching approved appointments:", error)
      );
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setModalIsOpen(true);

    if (
      moment(event.start).isSameOrBefore(currentTime) &&
      event.resource.status === "approved"
    ) {
      updateAppointmentStatus(event.resource, "in progress");
    }
  };

  const updateAppointmentStatus = async (
    appointmentToUpdate: any,
    status: string
  ) => {
    const updatedAppointment = {
      accountId: appointmentToUpdate.accountId,
      psychologistId: appointmentToUpdate.psychologistId,
      content: appointmentToUpdate.content,
      appointmentDate: appointmentToUpdate.appointmentDate,
      status: status,
    };

    try {
      await axios.put(
        `http://localhost:5199/Appointment/${appointmentToUpdate.id}`,
        updatedAppointment
      );
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointmentToUpdate.id
            ? { ...appt, resource: { ...appt.resource, status } }
            : appt
        )
      );
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedEvent || !selectedEvent.resource?.id) return;

    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );
    if (!confirmCancel) return;

    try {
      await axios.delete(
        `http://localhost:5199/Appointment/${selectedEvent.resource.id}`
      );
      setAppointments(
        appointments.filter((appt) => appt.id !== selectedEvent.resource.id)
      );
      setModalIsOpen(false);
    } catch (error) {
      console.error("Error canceling appointment:", error);
    }
  };

  const handleCheckIn = async (status: "completed" | "expired") => {
    if (!selectedEvent || !selectedEvent.resource?.id) return;
    updateAppointmentStatus(selectedEvent.resource, status);
    setModalIsOpen(false);
  };

  return (
    <div className="weekly-schedule">
      <h2>Weekly Schedule</h2>
      <Calendar
        step={60}
        timeslots={1}
        localizer={localizer}
        events={appointments}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        views={{ week: true, day: true }}
        style={{ height: 800 }}
        min={new Date(2025, 2, 13, 8, 0)}
        max={new Date(2025, 2, 13, 18, 0)}
        scrollToTime={new Date(2025, 2, 13, 8, 0)}
        eventPropGetter={(event) => {
          let backgroundColor = "#9e9e9e"; // Mặc định màu xám cho "approved"
          if (event.resource.status === "in progress")
            backgroundColor = "#2196f3"; // Màu xanh dương
          else if (event.resource.status === "expired")
            backgroundColor = "#f44336"; // Màu đỏ
          else if (event.resource.status === "completed")
            backgroundColor = "#4caf50"; // Màu xanh lá
          return { style: { backgroundColor } };
        }}
        {...() => ({ style: { backgroundColor: "#22c55e" } })}
        onSelectEvent={handleSelectEvent}
      />

      <Modal
        open={modalIsOpen}
        onCancel={() => setModalIsOpen(false)}
        footer={null}
        className="weekly-modal-content"
      >
        {selectedEvent && selectedEvent.resource ? (
          <div>
            <h2>Appointment Details</h2>
            <p>
              <strong>Name:</strong>{" "}
              {selectedEvent.resource?.account?.fullname || "N/A"}
            </p>
            <p>
              <strong>Email:</strong>{" "}
              {selectedEvent.resource?.account?.email || "N/A"}
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              {selectedEvent.resource?.account?.phone || "N/A"}
            </p>
            <p>
              <strong>Content:</strong>{" "}
              {selectedEvent.resource?.content || "No details available"}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {moment(selectedEvent.start).format("LLLL")}
            </p>
            {moment(selectedEvent.start).isSameOrBefore(currentTime) ? (
              <>
                <button
                  className="checkin-btn-present"
                  onClick={() => handleCheckIn("completed")}
                >
                  Check-in (Present)
                </button>
                <button
                  className="checkin-btn-absent"
                  onClick={() => handleCheckIn("expired")}
                >
                  Check-in (Absent)
                </button>
              </>
            ) : (
              <button className="cancel-btn" onClick={handleCancelAppointment}>
                Cancel Appointment
              </button>
            )}
          </div>
        ) : (
          <p>Loading appointment details...</p>
        )}
      </Modal>
    </div>
  );
};

export default WeeklySchedule;
