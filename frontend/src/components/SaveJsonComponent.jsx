import axios from "axios";
import { useState } from "react";
import styles from "../styles/SidebarComponent.module.css"
import { Download } from "lucide-react";

const SaveJsonComponent = ({ currentSetupId, currentSetup }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getConfig = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/setup/${currentSetupId}/all-config`);

      // Validate data
      if (!response.data) {
        throw new Error("No data received from server.");
      }

      // Build JSON blob
      const jsonStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      // Build filename
      const safeSetupName = currentSetup?.toLowerCase().replace(/\s+/g, "_") || "config";

      const link = document.createElement("a");
      link.href = url;
      link.download = `config_${safeSetupName}.json`;
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Error downloading the JSON. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={getConfig} disabled={loading} className={styles.btn}>
        <Download size={18}/>
        {loading ? "Downloading..." : "Download JSON"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default SaveJsonComponent;
