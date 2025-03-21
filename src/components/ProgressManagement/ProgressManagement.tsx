import React, { useEffect, useState } from "react";
import "./ProgressManagement.scss";

interface SubscriptionProgress {
  id: string;
  section: number;
  description: string;
  date: number;
  subscriptionId: string;
  isCompleted: boolean;
  createAt?: string;
  modifiedAt?: string;
  isDeleted?: boolean;
}

const API_URL = "http://localhost:5199/SubscriptionProgress";

const ProgressManagement: React.FC = () => {
  const [progressList, setProgressList] = useState<SubscriptionProgress[]>([]);
  const [formData, setFormData] = useState<Omit<SubscriptionProgress, "id">>({
    section: 0,
    description: "",
    date: 0,
    subscriptionId: "",
    isCompleted: false,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`${API_URL}`);
      const data = await response.json();
      setProgressList(data);
    } catch (error) {
      console.error("Error fetching progress", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetch(`${API_URL}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch(`${API_URL}/Create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      fetchProgress();
      setFormData({ section: 0, description: "", date: 0, subscriptionId: "", isCompleted: false });
      setEditingId(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving progress", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchProgress();
    } catch (error) {
      console.error("Error deleting progress", error);
    }
  };

  const handleEdit = (progress: SubscriptionProgress) => {
    setFormData(progress);
    setEditingId(progress.id);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setFormData({ section: 0, description: "", date: 0, subscriptionId: "", isCompleted: false });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h2>Subscription Progress Management</h2>
        <button className="add-btn" onClick={handleCreate}>
          + Create
        </button>
      </div>
      <table className="progress-table">
        <thead>
          <tr>
            <th>Section</th>
            <th>Description</th>
            <th>Date</th>
            <th>Subscription ID</th>
            <th>Completed</th>
            <th>Created At</th>
            <th>Modified At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {progressList.map((progress) => (
            <tr key={progress.id}>
              <td>{progress.section}</td>
              <td>{progress.description}</td>
              <td>{progress.date}</td>
              <td>{progress.subscriptionId}</td>
              <td>{progress.isCompleted ? "Yes" : "No"}</td>
              <td>{progress.createAt || "N/A"}</td>
              <td>{progress.modifiedAt || "N/A"}</td>
              <td>
                <button className="edit-btn" onClick={() => handleEdit(progress)}>
                  Edit
                </button>
                <button className="delete-btn" onClick={() => handleDelete(progress.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={closeModal} // Close modal when clicking outside the content
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
          >
            <h3>{editingId ? "Edit Progress" : "Create Progress"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="section">Section</label>
                <input
                  type="number"
                  id="section"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  type="number" // Changed from "date" to "number"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="subscriptionId">Subscription ID</label>
                <input
                  type="text"
                  id="subscriptionId"
                  name="subscriptionId"
                  value={formData.subscriptionId}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="isCompleted"
                    checked={formData.isCompleted}
                    onChange={handleChange}
                  />
                  Completed
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressManagement;
