import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./styles.css"; // Importing styles.css
import { FaPencilAlt, FaCheck, FaTimes, FaPlus } from "react-icons/fa"; // Importing icons

function Dashboard() {
  const [stocks, setStocks] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editableStock, setEditableStock] = useState({});
  const [newRow, setNewRow] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Header format with line breaks
  const formattedHeaders = {
    itemName: "ITEM<br>NAME",
    quantityReceived: "QUANTITY<br>RECEIVED",
    quantitySold: "QUANTITY<br>SOLD",
    unitPrice: "UNIT<br>PRICE",
    sellingPrice: "SELLING<br>PRICE",
    createdAt: "CREATED<br>AT",
    updatedAt: "UPDATED<br>AT",
  };

  // Fetch stocks (Descending order)
  const fetchStocks = useCallback(async () => {
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await axios.get("http://localhost:5000/api/stocks/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Sort stocks in DESCENDING order by `createdAt`
      const sortedStocks = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setStocks(sortedStocks || []); // Ensure stocks is always an array
    } catch (error) {
      console.error("Error fetching stocks:", error.response?.data || error.message);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // Enable edit mode
  const handleEditClick = () => {
    setEditMode(true);
    setEditableStock(
      stocks.reduce((acc, stock) => {
        acc[stock._id] = { ...stock };
        return acc;
      }, {})
    );
  };

  // Handle input change for editing & new rows
  const handleInputChange = (id, key, value) => {
    if (id === "new") {
      setNewRow((prev) => ({ ...prev, [key]: value }));
    } else {
      setEditableStock((prev) => ({
        ...prev,
        [id]: { ...prev[id], [key]: value },
      }));
    }
  };

  // Save updates
  const handleSaveClick = async () => {
    try {
      await Promise.all(
        Object.values(editableStock).map((stock) =>
          axios.put(`http://localhost:5000/api/stocks/update-sales/${stock._id}`, stock, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setEditMode(false);
      fetchStocks();
      alert("Stock's Updated");
    } catch (error) {
      console.error("Error updating stock:", error.response?.data || error.message);
      alert("Failed to update stock");
    }
  };

  // Cancel editing
  const handleCancelClick = () => {
    setEditMode(false);
    setEditableStock({});
  };

  // Add new row
  const handleAddRow = () => {
    setNewRow({
      itemName: "",
      quantityReceived: "",
      quantitySold: "",
      unitPrice: "",
      sellingPrice: "",
    });
    setEditMode(true);
  };

  // Save new stock entry (Add at the top)
  const handleSaveNewRow = async () => {
    if (!newRow?.itemName || !newRow?.quantityReceived || !newRow?.unitPrice || !newRow?.sellingPrice) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const currentDate = new Date();
      const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(((currentDate - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);

      const response = await axios.post(
        "http://localhost:5000/api/stocks/add",
        {
          ...newRow,
          week: weekNumber,
          year: currentDate.getFullYear(),
          createdAt: currentDate.toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Add new stock entry at the **TOP** of the list
      setStocks((prevStocks) => [response.data, ...prevStocks]);

      setNewRow(null);
      alert("New stock added successfully!");
    } catch (error) {
      console.error("Error adding stock:", error.response?.data || error.message);
      alert("Failed to add stock");
    }
  };

  return (
    <div>
      <h2>Stock Dashboard</h2>
      <button onClick={() => navigate("/")}>Logout</button>

      {/* Edit & Add Row Buttons */}
      <div className="edit-icons">
        <FaPlus className="icon add-row-icon" onClick={handleAddRow} />
        {!editMode ? (
          <FaPencilAlt className="icon pencil-icon" onClick={handleEditClick} />
        ) : (
          <>
            <FaCheck className="icon check-icon" onClick={handleSaveClick} />
            <FaTimes className="icon cancel-icon" onClick={handleCancelClick} />
          </>
        )}
      </div>

      {/* Stock Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {stocks.length > 0 &&
                Object.keys(stocks[0] || {})
                  .filter((key) => key !== "_id" && key !== "userId" && key !== "__v") // Exclude columns
                  .map((key) => (
                    <th
                      key={key}
                      className="center-header"
                      dangerouslySetInnerHTML={{ __html: formattedHeaders[key] || key.toUpperCase() }}
                    />
                  ))}
            </tr>
          </thead>
          <tbody>
            {/* Existing Stock Data (Displayed in DESCENDING ORDER) */}
            {stocks.map((stock) => (
              <tr key={stock._id}>
                {Object.entries(stock)
                  .filter(([key]) => key !== "_id" && key !== "userId" && key !== "__v") // Exclude unnecessary columns
                  .map(([key, value]) => (
                    <td key={key}>
                      {editMode && !["week", "year", "createdAt", "updatedAt"].includes(key) ? (
                        <input
                          type={typeof value === "number" ? "number" : "text"}
                          value={editableStock[stock._id]?.[key] ?? value} // ✅ Fixes undefined error
                          onChange={(e) => handleInputChange(stock._id, key, e.target.value)}
                        />
                      ) : (
                        value
                      )}
                    </td>
                  ))}
              </tr>
            ))}

            {/* New Row for Adding Data */}
            {newRow && (
              <tr>
                {Object.keys(newRow).map((key) => (
                  <td key={key}>
                    <input
                      type={key.includes("quantity") || key.includes("price") ? "number" : "text"}
                      value={newRow[key] || ""}
                      onChange={(e) => handleInputChange("new", key, e.target.value)}
                    />
                  </td>
                ))}
                <td>
                  <FaCheck className="icon check-icon" onClick={handleSaveNewRow} />
                  <FaTimes className="icon cancel-icon" onClick={() => setNewRow(null)} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
