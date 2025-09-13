import axios from "axios";
import { useCallback, useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import styles from "../styles/ConfigComponent.module.css";
import Tooltip from "./Tooltip";

// Simple Info Icon Component
const InfoIcon = () => (
  <svg
    className={styles.infoIcon}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 16v-4"></path>
    <path d="M12 8h.01"></path>
  </svg>
);

const ConfigComponent = () => {
  const [setupConfig, setSetupConfig] = useState({
    device_type: "",
    timestamp_start: "",
    timestamp_end: "",
    extract_data_path: "",
    stop_team_after: 0,
    tracker_type: "",
    output_fps: 0,
    output_path: "",
    debug_visualize: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { currentSetupId } = useContext(AppContext);

  const infoText = {
    device_type: "Select the type of camera device being used",
    timestamp_start: "Starting timestamp for data extraction",
    timestamp_end: "Ending timestamp for data extraction",
    extract_data_path: "Path where extracted data will be stored",
    stop_team_after: "Number of seconds after which team detection stops",
    tracker_type: "Type of tracking algorithm to use",
    output_fps: "Frames per second for output video",
    output_path: "Directory path for output files",
    debug_visualize: "Enable debug visualization overlay",
  };

  // Send setup config to backend
  const sendSetupConfig = useCallback(async (data) => {
    if (!currentSetupId) {
      console.warn("No currentSetupId available");
      return;
    }

    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/setup/${currentSetupId}`,
        data
      );
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error sending setup config:", error);
      alert("Failed to save configuration. Please try again later.");
    }
  }, [currentSetupId]);

  // Get setup config from backend and update setupConfig
  const getSetupConfig = useCallback(async () => {
    if (!currentSetupId) {
      console.warn("No currentSetupId available");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/setup/${currentSetupId}`
      );
      
      // Ensure we have all required fields with proper defaults
      const configData = {
        device_type: response.data.device_type || "",
        timestamp_start: response.data.timestamp_start || "",
        timestamp_end: response.data.timestamp_end || "",
        extract_data_path: response.data.extract_data_path || "",
        stop_team_after: response.data.stop_team_after || 0,
        tracker_type: response.data.tracker_type || "",
        output_fps: response.data.output_fps || 0,
        output_path: response.data.output_path || "",
        debug_visualize: response.data.debug_visualize || false,
      };
      
      setSetupConfig(configData);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error fetching setup config:", error);
      alert("Failed to load configuration. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [currentSetupId]);

  // Handle configuration changes
  const handleConfigChange = useCallback((key, value) => {
    setSetupConfig((prev) => {
      // Convert numeric values properly
      let processedValue = value;
      if (key === "stop_team_after" || key === "output_fps") {
        processedValue = value === "" ? 0 : Number(value);
      }
      
      const newConfig = {
        ...prev,
        [key]: processedValue,
      };
      
      setHasUnsavedChanges(true);
      return newConfig;
    });
  }, []);

  // Debounced save effect - only runs when setupConfig changes and we're not loading
  useEffect(() => {
    if (isLoading || !hasUnsavedChanges || !currentSetupId) {
      return;
    }

    const timeout = setTimeout(() => {
      sendSetupConfig(setupConfig);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [setupConfig, sendSetupConfig, isLoading, hasUnsavedChanges, currentSetupId]);

  // Get setup config when currentSetupId or currentCamera changes
  useEffect(() => {
    if (currentSetupId ) {
      getSetupConfig();
    } else {
      // Reset to defaults if no setup or camera selected
      setSetupConfig({
        device_type: "",
        timestamp_start: "",
        timestamp_end: "",
        extract_data_path: "",
        stop_team_after: 0,
        tracker_type: "",
        output_fps: 0,
        output_path: "",
        debug_visualize: false,
      });
      setIsLoading(false);
      setHasUnsavedChanges(false);
    }
  }, [currentSetupId, getSetupConfig]);

  // Show loading state
  if (isLoading && currentSetupId) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Configuration - Camera</h1>
        </div>
        <div className={styles.content}>
          <div className={styles.loadingMessage}>
            <p>Loading configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no setup or camera selected
  if (!currentSetupId) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Configuration - Camera</h1>
        </div>
        <div className={styles.content}>
          <div className={styles.noSetupMessage}>
            <p>Please select a setup to configure.</p>
          </div>
        </div>
      </div>
    );
  }

  

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
       
        {hasUnsavedChanges && (
          <span className={styles.unsavedIndicator}>Unsaved changes...</span>
        )}
      </div>

      <div className={styles.content}>
        {/* Setup Configuration */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Setup Configuration</h2>

          <div>
            {Object.entries(setupConfig).map(([key, value]) => (
              <div key={key} className={styles.formGroup}>
                <label className={styles.label}>
                  {key
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                  :
                </label>

                {typeof value === "boolean" ? (
                  <div className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        handleConfigChange(key, e.target.checked)
                      }
                      className={styles.checkbox}
                    />
                  </div>
                ) : (
                  <input
                    type={
                      key.includes("fps") || key.includes("after")
                        ? "number"
                        : "text"
                    }
                    value={value}
                    onChange={(e) => handleConfigChange(key, e.target.value)}
                    className={styles.input}
                    placeholder={`Enter ${key.replace(/_/g, " ")}`}
                    min={key.includes("fps") || key.includes("after") ? "0" : undefined}
                  />
                )}

                <div className={styles.infoContainer}>
                  <Tooltip content={infoText[key]} position="right">
                  <InfoIcon />
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigComponent;