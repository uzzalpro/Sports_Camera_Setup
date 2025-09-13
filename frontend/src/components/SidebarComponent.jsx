import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import styles from "../styles/SidebarComponent.module.css";
import SaveJsonComponent from "./SaveJsonComponent";

const SidebarComponent = () => {
  const { currentSetup, currentSetupId, currentCamera } = useContext(AppContext);

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.text}>TRACKB</span>
        <img src="/icon_trackbox.png" alt="Trackbox Logo" />
        <span className={styles.text}>X</span>
      </div>

      <div className={styles.sectionTitle}>Discover</div>

      <ul className={styles.ul}>
        {/* Home */}
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${styles.navlink} ${isActive ? styles.active : ""}`
            }
          >
            Setup
          </NavLink>
        </li>

        {/* Show other links only if setup is selected */}
        <li>
          <NavLink
            to="/camera"
            className={({ isActive }) =>
              `${styles.navlink} ${isActive ? styles.active : ""} ${!currentSetup ? styles.disabled : ""}`
            }
          >
            Camera
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/overview"
            className={({ isActive }) =>
              `${styles.navlink} ${isActive ? styles.active : ""} ${!currentSetup ? styles.disabled : ""}`
            }
          >
            Overview
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/config"
            className={({ isActive }) =>
              `${styles.navlink} ${isActive ? styles.active : ""} ${!currentSetup ? styles.disabled : ""}`
            }
          >
            Config
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/team"
            className={({ isActive }) =>
              `${styles.navlink} ${isActive ? styles.active : ""} ${!currentSetup ? styles.disabled : ""}`
            }
          >
            Team Detector
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/detect"
            className={({ isActive }) =>
              `${styles.navlink} ${isActive ? styles.active : ""} ${!currentSetup ? styles.disabled : ""}`
            }
          >
            Detector Component
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/field"
            className={({ isActive }) =>
              `${styles.navlink} ${isActive ? styles.active : ""} ${!currentSetup ? styles.disabled : ""}`
            }
          >
            Field Component
          </NavLink>
        </li>
      </ul>

      {/* Show setup and camera names */}
      <div className={styles.currentContainer}>
        {currentSetup && (
          <>
            <p>Setup &rarr; {currentSetup}</p>
            {currentCamera && <p>Camera &rarr; {currentCamera}</p>}
          </>
        )}
      </div>

      {/* Show JSON download only if setup is selected */}
      {currentSetup && currentSetupId && (
        <SaveJsonComponent
          currentSetupId={currentSetupId}
          currentSetup={currentSetup}
        />
      )}
    </div>
  );
};

export default SidebarComponent;