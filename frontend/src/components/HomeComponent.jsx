import axios from "axios";
import { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import styles from "../styles/HomeComponent.module.css";

// Constants for better maintainability
const ERROR_MESSAGES = {
  SETUP_EXISTS: "Setup already exists!",
  EMPTY_NAME: "Setup name cannot be empty!",
  SAME_NAME: "New name is the same as the current name.",
  FETCH_ERROR: "Failed to fetch setup names. Please try again later.",
  DELETE_ERROR: "Failed to delete setup. Please try again.",
  CREATE_ERROR: "Failed to create setup. Please try again.",
  RENAME_ERROR: "Failed to rename setup. Please try again.",
};

const CONFIRM_MESSAGES = {
  DELETE_SETUP: "Are you sure you want to delete this setup?",
};

const HomeComponent = () => {
  const {
    currentSetupId,
    setCurrentSetup,
    setCurrentSetupId,
    currentSetup,
    // Add these context functions to clear state
    setCurrentCamera,
    setCurrentCamId,
    setImageURL,
    setAllCamConfig,
    setCropData,
    setInnerPoints,
    setOuterPoints,
    setUndParams,
    setHgSrcPts,
    setHgDstPts,
    setImageSize,
    imageURL,
  } = useContext(AppContext);

  const [setupList, setSetupList] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [renameInputValue, setRenameInputValue] = useState("");
  const [selectedSetupId, setSelectedSetupId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();

  // Memoized API base URL
  const apiBaseUrl = useMemo(
    () => `${import.meta.env.VITE_API_URL}/api/setup`,
    []
  );

  // Utility function to normalize setup_id
  const normalizeSetupId = useCallback((setupId) => {
    return typeof setupId === "object" && setupId?.setup_id
      ? setupId.setup_id
      : setupId;
  }, []);

  // Utility function to sanitize input
  const sanitizeInput = useCallback((input) => {
    return input?.toString().trim() || "";
  }, []);

  // Show user-friendly notifications (replace alert with better UX)
  const showNotification = useCallback((message, type = "info") => {
    // In a real app, you'd use a toast library like react-toastify
    // For now, using alert but structured for easy replacement
    alert(message);
  }, []);

  // Function to clear all camera-related state
  const clearAllCameraState = useCallback(() => {
    console.log("Clearing all camera state...");

    // Clean up image URL to prevent memory leaks
    if (imageURL) {
      URL.revokeObjectURL(imageURL);
    }

    // Reset all camera-related state
    setCurrentCamera("Choose Camera");
    setCurrentCamId("");
    setImageURL(null);
    setAllCamConfig({});
    setCropData([]);
    setInnerPoints([]);
    setOuterPoints([]);
    setUndParams();
    setHgSrcPts();
    setHgDstPts();
    setImageSize({ width: 0, height: 0 });
  }, [
    imageURL,
    setCurrentCamera,
    setCurrentCamId,
    setImageURL,
    setAllCamConfig,
    setCropData,
    setInnerPoints,
    setOuterPoints,
    setUndParams,
    setHgSrcPts,
    setHgDstPts,
    setImageSize,
  ]);

  // Get setup names from backend
  const fetchSetupNames = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(apiBaseUrl);
      setSetupList(response.data || []);
    } catch (error) {
      console.error("Error fetching setup names:", error);
      showNotification(ERROR_MESSAGES.FETCH_ERROR, "error");
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, showNotification]);

  // Load setups on component mount
  useEffect(() => {
    fetchSetupNames();
  }, [fetchSetupNames]);

  // Validation function for setup names
  const validateSetupName = useCallback(
    (name, excludeSetupId = null) => {
      const sanitizedName = sanitizeInput(name);

      if (!sanitizedName) {
        return { isValid: false, error: ERROR_MESSAGES.EMPTY_NAME };
      }

      const isDuplicate = setupList.some(
        (setup) =>
          sanitizeInput(setup.setup_name).toLowerCase() ===
            sanitizedName.toLowerCase() &&
          normalizeSetupId(setup.setup_id) !== excludeSetupId
      );

      if (isDuplicate) {
        return { isValid: false, error: ERROR_MESSAGES.SETUP_EXISTS };
      }

      return { isValid: true, error: null };
    },
    [setupList, sanitizeInput, normalizeSetupId]
  );

  // Add a new setup
  const addSetup = useCallback(
    async (setupName) => {
      const sanitizedName = sanitizeInput(setupName);
      const validation = validateSetupName(sanitizedName);

      if (!validation.isValid) {
        showNotification(validation.error, "error");
        return;
      }

      setIsCreating(true);
      try {
        const response = await axios.post(apiBaseUrl, {
          setup_name: sanitizedName,
        });

        const newSetup = {
          setup_id: response.data,
          setup_name: sanitizedName,
        };

        setSetupList((prevList) => [...prevList, newSetup]);
        setInputValue("");
        showNotification("Setup created successfully!", "success");
      } catch (error) {
        console.error("Error creating setup:", error);
        showNotification(ERROR_MESSAGES.CREATE_ERROR, "error");
      } finally {
        setIsCreating(false);
      }
    },
    [apiBaseUrl, validateSetupName, sanitizeInput, showNotification]
  );

  // Handle Enter key press for adding setup
  const handleAddSetupKeyPress = useCallback(
    (event) => {
      if (event.key === "Enter" && inputValue.trim()) {
        addSetup(inputValue);
      }
    },
    [inputValue, addSetup]
  );

  // Handle setup selection and navigation - FIXED TO CLEAR STATE
  const handleSetupSelection = useCallback(
    (setupName, setupId) => {
      const normalizedId = normalizeSetupId(setupId);

      // Clear all camera state when switching setups
      clearAllCameraState();

      // Set new setup
      setCurrentSetup(setupName);
      setCurrentSetupId(normalizedId);

      // Navigate to camera page
      navigate("/camera");
    },
    [
      setCurrentSetup,
      setCurrentSetupId,
      navigate,
      normalizeSetupId,
      clearAllCameraState,
      currentSetupId,
    ]
  );

  // Start renaming a setup
  const startRenaming = useCallback(
    (setupName, setupId) => {
      const normalizedId = normalizeSetupId(setupId);
      setSelectedSetupId(normalizedId);
      setRenameInputValue(sanitizeInput(setupName));
    },
    [normalizeSetupId, sanitizeInput]
  );

  // Cancel renaming
  const cancelRenaming = useCallback(() => {
    setRenameInputValue("");
    setSelectedSetupId(null);
  }, []);

  // Rename setup
  const renameSetup = useCallback(
    async (newName) => {
      const sanitizedName = sanitizeInput(newName);
      const validation = validateSetupName(sanitizedName, selectedSetupId);

      if (!validation.isValid) {
        showNotification(validation.error, "error");
        return;
      }

      // Check if name is the same as current
      const originalSetup = setupList.find(
        (s) => normalizeSetupId(s.setup_id) === selectedSetupId
      );
      if (
        originalSetup &&
        sanitizeInput(originalSetup.setup_name).toLowerCase() ===
          sanitizedName.toLowerCase()
      ) {
        showNotification(ERROR_MESSAGES.SAME_NAME, "error");
        return;
      }

      try {
        await axios.patch(`${apiBaseUrl}/${selectedSetupId}`, {
          setup_name: sanitizedName,
        });

        setSetupList((prevList) =>
          prevList.map((item) =>
            normalizeSetupId(item.setup_id) === selectedSetupId
              ? { ...item, setup_name: sanitizedName }
              : item
          )
        );

        // If renaming the current setup, update context
        if (selectedSetupId === currentSetupId) {
          setCurrentSetup(sanitizedName);
        }

        cancelRenaming();
        showNotification("Setup renamed successfully!", "success");
      } catch (error) {
        console.error("Error renaming setup:", error);
        showNotification(ERROR_MESSAGES.RENAME_ERROR, "error");
      }
    },
    [
      selectedSetupId,
      validateSetupName,
      setupList,
      normalizeSetupId,
      sanitizeInput,
      apiBaseUrl,
      cancelRenaming,
      showNotification,
      currentSetupId,
      setCurrentSetup,
    ]
  );

  // Handle rename input key events
  const handleRenameKeyPress = useCallback(
    (event) => {
      if (event.key === "Escape") {
        cancelRenaming();
      } else if (event.key === "Enter" && renameInputValue.trim()) {
        renameSetup(renameInputValue);
      }
    },
    [renameInputValue, cancelRenaming, renameSetup]
  );

  // Delete setup - ALSO CLEAR STATE IF CURRENT SETUP IS DELETED
  const deleteSetup = useCallback(
    async (setupId) => {
      const normalizedId = normalizeSetupId(setupId);

      if (!window.confirm(CONFIRM_MESSAGES.DELETE_SETUP)) {
        return;
      }

      try {
        await axios.delete(`${apiBaseUrl}/${normalizedId}`);

        setSetupList((prevList) =>
          prevList.filter(
            (setup) => normalizeSetupId(setup.setup_id) !== normalizedId
          )
        );

        // Clear current setup if it was deleted
        if (normalizedId === currentSetupId) {
          clearAllCameraState(); // Clear camera state too
          setCurrentSetup(null);
          setCurrentSetupId(null);
        }

        showNotification("Setup deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting setup:", error);
        showNotification(ERROR_MESSAGES.DELETE_ERROR, "error");
      }
    },
    [
      normalizeSetupId,
      apiBaseUrl,
      currentSetupId,
      setCurrentSetup,
      setCurrentSetupId,
      showNotification,
      clearAllCameraState,
    ]
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Setups</h1>
      <p className={styles.subtitle}>
        Input a setup name and add it to the list
      </p>
      <p className={styles.subtitle}>Choose a setup to configure.</p>

      <div className={styles.inputForm}>
        <input
          className={styles.input}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleAddSetupKeyPress}
          disabled={isCreating}
          placeholder="Enter setup name..."
        />
        <button
          className={styles.addButton}
          onClick={() => addSetup(inputValue)}
          disabled={isCreating || !inputValue.trim()}
        >
          {isCreating ? "Adding..." : "Add"}
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Loading setups...</div>
      ) : (
        <ul className={styles.ul} data-testid="setup-list">
          {setupList.map((setup) => {
            const setupId = normalizeSetupId(setup.setup_id);
            const isRenaming = selectedSetupId === setupId;
            const isCurrentSetup = setupId === currentSetupId;

            return (
              <li
                className={`${styles.setupItem} ${
                  isCurrentSetup ? styles.currentSetup : ""
                }`}
                key={setupId}
              >
                <button
                  className={`${styles.setupButton} ${
                    isCurrentSetup ? styles.currentSetupButton : ""
                  }`}
                  onClick={() =>
                    handleSetupSelection(setup.setup_name, setupId)
                  }
                  disabled={isRenaming}
                >
                  {setup.setup_name} {isCurrentSetup && "(Current)"}
                </button>

                {isRenaming ? (
                  <div className={styles.renameContainer}>
                    <input
                      className={styles.renameInput}
                      data-testid={`rename-input-${setupId}`}
                      value={renameInputValue}
                      onChange={(e) => setRenameInputValue(e.target.value)}
                      onKeyDown={handleRenameKeyPress}
                      autoFocus
                      placeholder="Enter new name..."
                    />
                    <button
                      className={styles.cancelButton}
                      onClick={cancelRenaming}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className={styles.actionButtons}>
                    <button
                      className={styles.renameButton}
                      onClick={() => startRenaming(setup.setup_name, setupId)}
                    >
                      Rename
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => deleteSetup(setupId)}
                      disabled={isCurrentSetup} // Prevent deleting current setup for safety
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {setupList.length === 0 && !isLoading && (
        <div className={styles.emptyState}>
          <p>No setups found. Create your first setup above!</p>
        </div>
      )}
    </div>
  );
};

export default HomeComponent;
