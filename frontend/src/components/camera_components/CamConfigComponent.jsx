import axios from "axios";
import { useContext, useEffect, useState } from "react";
import styles from "../../styles/CamConfigComponent.module.css";
import { AppContext } from "../../context/AppContext";

const CamConfigComponent = () => {
  const { currentCamId, config, allCamConfig, setConfig } = useContext(AppContext);

  const defaultConfig = {
    resolution_width: 0,
    resolution_height: 0,
    position: "",
    cropping_type: "",
    time_correction: 0,
    path: ""
  };
  const [camConfig, setCamConfig] = useState(defaultConfig);

  useEffect(() => {
    setConfig(allCamConfig.config)
  },[allCamConfig.config])


  const sendCamConfig = async (data) => {
    console.log("Sending camera config Data in cam config component:", data);
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/camera/${currentCamId}`, data);
    } catch (error) {
      console.error("Error sending camera config:", error);
      alert("Failed to save camera configuration. Please try again.");
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      sendCamConfig(camConfig);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [camConfig]);

  useEffect(() => {
    if (config && Object.keys(config).length > 0) {
      setCamConfig(config);
    } else {
      setCamConfig(defaultConfig);
    }
  }, [JSON.stringify(config)]);

  const formatLabel = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  const getPlaceholder = (key) => {
    const placeholders = {
      resolution_width: "Enter width (e.g., 1920)",
      resolution_height: "Enter height (e.g., 1080)",
      position: "Enter camera position",
      cropping_type: "Enter cropping type",
      time_correction: "Enter time correction (seconds)",
      path: "Enter file path"
    };
    return placeholders[key] || `Enter ${formatLabel(key).toLowerCase()}`;
  };

  const getHelpText = (key) => {
    const helpTexts = {
      resolution_width: "Width resolution for camera output",
      resolution_height: "Height resolution for camera output",
      position: "Physical position or location of camera",
      cropping_type: "Type of cropping algorithm to apply",
      time_correction: "Time offset correction in seconds",
      path: "File system path for camera data storage"
    };
    return helpTexts[key] || "";
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configuration - Camera</h1>
      </div>

      <div className={styles.configCard}>
        <h2 className={styles.cardTitle}>Setup Configuration</h2>

        <div className={styles.inputsContainer}>
          {Object.keys(camConfig).map((key) => (
            <div key={key} className={styles.inputRow}>
              <div className={styles.inputSection}>
                <label htmlFor={key} className={styles.label}>
                  {formatLabel(key)}:
                </label>
                <input
                  type={["width", "height", "correction"].some(k => key.includes(k)) ? 'number' : 'text'}
                  id={key}
                  value={camConfig[key]}
                  onChange={(e) => setCamConfig(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={getPlaceholder(key)}
                  className={styles.input}
                />
              </div>
              <div className={styles.helpSection}>
                <div className={styles.helpIndicator}>
                  <div className={styles.helpDot}></div>
                </div>
                <span className={styles.helpText}>
                  {getHelpText(key)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CamConfigComponent;