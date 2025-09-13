import axios from "axios";
import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import styles from "../styles/CameraComponent.module.css";
import CamConfigComponent from "./camera_components/CamConfigComponent";
import CamCropMarkingComponent from "./camera_components/CamCropMarkingComponent";
import CamPitchMarkingComponent from "./camera_components/CamPitchMarkingComponent";
import CamUndistortionComponent from "./camera_components/CamUndistortionComponent";

const CameraComponent = () => {
  const {
    setCurrentCamera,
    currentSetupId,
    currentSetup,
    currentCamId,
    setCurrentCamId,
    imageURL,
    setImageURL,
    setAllCamConfig,
    setCropData,
    setInnerPoints,
    setOuterPoints,
    setUndParams,
    setHgDstPts,
    setHgSrcPts,
  } = useContext(AppContext);

  //
  const [renameIsInput, setRenameIsInput] = useState(false);
  const [cameraList, setCameraList] = useState([]);
  const [currentCam, setCurrentCam] = useState("Choose Camera");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);  // Added loading state
  const [error, setError] = useState(null);  // Added error state
  const renameInputRef = useRef(null);

  // Changes the renameIsInput state to switch between button and inputfield
  const handleRenameIsInput = (state) => {
    setRenameIsInput(state);
  };

  // Sets the current camera for the page as well as the sidebar
  const handleCamSelect = (camera_name, camera_id) => {
    try {
      setLoading(true);
      setError(null);

      setCurrentCam(camera_name);
      setCurrentCamera(camera_name);
      setCurrentCamId(camera_id);

      // Reset all states when changing cameras
      setAllCamConfig({});
      setCropData([]); // Make sure this is cleared
      setInnerPoints([]);
      setOuterPoints([]);
      setUndParams();
      setHgSrcPts();
      setHgDstPts();

      // Clean up previous image URL
      if (imageURL) {
        URL.revokeObjectURL(imageURL);
      }
      setImageURL(null);
    } catch (error) {
      console.error("Error selecting camera:", error);
      setError("Failed to select camera");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getImg(currentCamId);
  }, [currentCamId]);

  // Adds a camera name to the list of cameras and resets the inputfield
  const addCamera = async (camera) => {
    const trimmedName = camera.trim();

    // Check for empty string
    if (trimmedName === "") {
      alert("Camera name cannot be empty.");
      return;
    }

    // Check for duplicate name (case-insensitive)
    const isDuplicate = cameraList.some(
      (cam) =>
        cam.camera_name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      alert("Camera name already exists. Please enter a unique name.");
      return;
    }

    try {
      setLoading(true);
      await sendCameraName(trimmedName);
      setInputValue("");
    } catch (error) {
      console.error("Error adding camera:", error);
    } finally {
      setLoading(false);
    }
  };

  // Pressing enter in the inputfield will call the addCamera function
  const addCamEnterPressed = (event) => {
    if (event.key === "Enter") {
      addCamera(inputValue);
    }
  };

  // Pressing enter in the inputfield will rename the camera
  const renameCamEnterPressed = async (event) => {
    if (event.key === "Enter") {
      const new_name = renameInputRef.current?.value.trim();

      if (!new_name) {
        alert("Camera name cannot be empty.");
        return;
      }

      if (new_name.toLowerCase() === currentCam.trim().toLowerCase()) {
        alert("New name is the same as the current name.");
        return;
      }

      const isDuplicate = cameraList.some(
        (cam) => cam.camera_name.trim().toLowerCase() === new_name.toLowerCase()
      );

      if (isDuplicate) {
        alert("Camera name already exists. Please enter a unique name.");
        return;
      }

      try {
        await sendRenameCam(new_name);

        const updatedList = cameraList.map((item) =>
          item.camera_id === currentCamId
            ? { ...item, camera_name: new_name }
            : item
        );
        setCameraList(updatedList);
        setCurrentCam(new_name);
        setCurrentCamera(new_name);
        handleRenameIsInput(false);
      } catch (error) {
        console.error("Error renaming camera:", error);
      }
    }
  };

  const deleteCam = async () => {
    try {
      setLoading(true);
      await sendDeleteCam();

      setCameraList(
        cameraList.filter((item) => item.camera_id !== currentCamId)
      );
      setCurrentCam("Choose Camera");
      setCurrentCamera("Choose Camera");
      setCurrentCamId("");
      setAllCamConfig({});
      setInnerPoints([]);
      setOuterPoints([]);
      setCropData([]); // Make sure this is cleared
      setUndParams();
      setHgSrcPts();
      setHgDstPts();

      if (imageURL) {
        URL.revokeObjectURL(imageURL);
      }
      setImageURL(null);
    } catch (error) {
      console.error("Error deleting camera:", error);
    } finally {
      setLoading(false);
    }
  };

  // Validate file type before upload
  const validateImageFile = (file) => {
    if (!file) return false;

    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp",
      "image/svg+xml",
    ];
    return validImageTypes.includes(file.type);
  };

  // Changes the displayed image from an upload img input field
  const handleUploadImg = async (img) => {
    if (!img) return;

    // Validate that the file is an image
    if (!validateImageFile(img)) {
      alert(
        "Please select a valid image file (JPEG, PNG, GIF, BMP, WebP, or SVG)."
      );
      return;
    }

    const formData = new FormData();
    formData.append("image", img);
    formData.append("setup", currentSetup);
    formData.append("camera", currentCam);

    try {
      setLoading(true);
      await axios.post(
        `${
          import.meta.env.VITE_API_URL
        }/api/camera/${currentCamId}/cam_cfg_path`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      handleImgChange(img);
      // After successful upload, get the camera config
      await getCurrentCamConfig();
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get correct image blob from backend
  const getImg = async (camera_id) => {
    if (!camera_id) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/camera/${camera_id}/cam_cfg_path`,
        { responseType: "blob" }
      );

      // Check if we actually received image data
      if (response.data && response.data.size > 0) {
        // Check if it's actually an image by looking at the content type
        const contentType =
          response.headers["content-type"] || response.data.type;

        if (contentType && contentType.startsWith("image/")) {
          handleImgChange(response.data);
          // If image exists, get the camera config
          await getCurrentCamConfig();
        } else {
          // Not an image or no image
          setImageURL(null);
        }
      } else {
        // No image data received
        setImageURL(null);
      }
    } catch (error) {
      // Error fetching image (likely means no image exists)
      // Don't show alert for missing images, it's expected behavior
      setImageURL(null);
    } finally {
      setLoading(false);
    }
  };

  // Get camera configuration when currentCamId changes
  useEffect(() => {
    if (currentCamId) {
      getCurrentCamConfig();
    }
  }, [currentCamId]);

  // Change the displayed img
  const handleImgChange = (img) => {
    // Clean up previous URL if it exists
    if (imageURL) {
      URL.revokeObjectURL(imageURL);
    }
    const url = URL.createObjectURL(img);
    setImageURL(url);
  };

  // Send name of added cam to backend
  const sendCameraName = async (data) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/setup/${currentSetupId}/camera`,
        { camera_name: data }
      );


      // Extract the camera_id from the response
      const newCameraId = response.data.camera_id || response.data;

      setCameraList([
        ...cameraList,
        { camera_id: newCameraId, camera_name: data },
      ]);
    } catch (error) {
      console.error("Error sending camera name:", error);
      alert("Failed to add camera. Please try again later.");
      throw error;  // Re-throw to handle in calling function
    }
  };

  // Get name of every cam of current setup from backend
  const getCameraNames = async () => {
    if (!currentSetupId) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/setup/${currentSetupId}/camera`
      );
      setCameraList(response.data);
    } catch (error) {
      console.error("Error fetching camera names:", error);
      setError("Failed to load camera names");
    } finally {
      setLoading(false);
    }
  };

  // Send new name of selected cam to backend
  const sendRenameCam = async (data) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/camera/${currentCamId}`,
        { camera_name: data }
      );
    } catch (error) {
      console.error("Error renaming camera:", error);
      alert("Failed to rename camera. Please try again later.");
      throw error; // Re-throw to handle in calling function
    }
  };

  // Send delete request of selected cam to backend
  const sendDeleteCam = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/camera/${currentCamId}`
      );
    } catch (error) {
      console.error("Error deleting camera:", error);
      alert("Failed to delete camera. Please try again later.");
      throw error; // Re-throw to handle in calling function
    }
  };

  // Fixed getCurrentCamConfig function for CameraComponent
  const getCurrentCamConfig = async () => {
    if (!currentCamId) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/camera/${currentCamId}`
      );

      // Set the complete config object
      await setAllCamConfig(response.data);
      console.log("All camera config in getCurrentCamConfig:", response.data);

      // Only set crop data directly since it's handled differently
      if (response.data.crops) {
        setCropData(response.data.crops);
      }
      if (response.data.undistortion) {
        setUndParams(response.data.undistortion);
      }
      if (response.data.source_points) {
        setHgSrcPts(response.data.source_points);
      }
      if (response.data.destination_points) {
        setHgDstPts(response.data.destination_points);
      }
    } catch (error) {
      console.error("Error fetching camera config:", error);
      setAllCamConfig({});
    }
  };

  // Also update the dropdown change handler:
  const handleCamSelectChange = (e) => {
    console.log("Camera select changed event:", e.target.value);
    const selectedId = e.target.value;

    if (selectedId === "") {
      // Reset everything when no camera selected
      setCurrentCam("Choose Camera");
      setCurrentCamera("Choose Camera");
      setCurrentCamId("");
      setInnerPoints([]);
      setOuterPoints([]);
      setCropData([]); // Make sure this is cleared
      setUndParams();
      setHgSrcPts();
      setHgDstPts();
      if (imageURL) {
        URL.revokeObjectURL(imageURL);
      }
      setImageURL(null);
      setAllCamConfig({});
    } else {
      const selectedCam = cameraList.find(
        (cam) => cam.camera_id === selectedId
      );
      if (selectedCam) {
        handleCamSelect(selectedCam.camera_name, selectedCam.camera_id);
      }
    }
  };

  // Handle blur event for rename input
  const handleRenameBlur = () => {
    setRenameIsInput(false);
  };

  // Focus the rename input when renameIsInput becomes true
  useEffect(() => {
    if (renameIsInput && renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [renameIsInput]);

  // Get camera names from backend on load
  useEffect(() => {
    if (currentSetupId) {
      getCameraNames();
    }
  }, [currentSetupId]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Camera</h1>
      </div>

      <div className={styles.instructions}>
        <p>Input a camera name and add it to the list.</p>
        <p>Choose a camera from the list.</p>
        <p>Upload an image for the camera.</p>
      </div>

      {/* Error display */}
      {error && (
        <div className={styles.errorMessage}>
          <p style={{ color: "red" }}>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className={styles.loadingMessage}>
          <p>Loading...</p>
        </div>
      )}

      {/* Input and Add button on same line */}
      <div className={styles.addCameraSection}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={addCamEnterPressed}
          className={styles.addInput}
          placeholder="Enter camera name"
          disabled={loading}
        />
        <button
          onClick={() => addCamera(inputValue)}
          className={styles.addButton}
          disabled={loading || !inputValue.trim()}
        >
          Add
        </button>
      </div>

      <div className={styles.cameraSelection}>
        <div className={styles.dropdown}>
          <select
            value={currentCamId}
            onChange={handleCamSelectChange}
            className={styles.selectDropdown}
            disabled={loading}
          >
            <option value="">Choose Camera</option>
            {cameraList.map((camera) => (
              <option key={camera.camera_id} value={camera.camera_id}>
                {camera.camera_name}
              </option>
            ))}
          </select>
        </div>

        {/* When there's a camera selected we show and offer buttons to delete or rename the selected camera aswell as uploading an image */}
        {currentCamId && (
          <div className={styles.adjustButtons}>
            <button
              onClick={deleteCam}
              className={styles.actionButton}
              disabled={loading}
            >
              Delete
            </button>
            {renameIsInput ? (
              <input
                ref={renameInputRef}
                defaultValue={currentCam}
                onKeyDown={renameCamEnterPressed}
                onBlur={handleRenameBlur}
                className={styles.renameInput}
              />
            ) : (
              <button
                onClick={() => handleRenameIsInput(true)}
                className={styles.actionButton}
                disabled={loading}
              >
                Rename
              </button>
            )}
            <div className={styles.fileInputWrapper}>
              <input
                className={styles.uploadInput}
                data-testid="file-input"
                id="fileInput"
                type="file"
                onChange={(e) => handleUploadImg(e.target.files[0])}
                accept="image/*"
                disabled={loading}
              />
              <label htmlFor="fileInput" className={styles.uploadLabel}>
                Choose File
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Show message if camera is selected but no image uploaded */}
      {currentCamId && !imageURL && !loading && (
        <div className={styles.noImageMessage}>
          <p>Please upload an image to configure camera settings.</p>
        </div>
      )}

      {/* Only show the camera configuration if a camera is selected AND has an image */}
      {currentCamId && imageURL && (
        <div className={styles.camComponents}>
          {/* Every subcomponent of the Camera page - no more props needed! */}
          <CamConfigComponent />
          <CamPitchMarkingComponent />
          <CamCropMarkingComponent />
          <CamUndistortionComponent />
        </div>
      )}
    </div>
  );
};

export default CameraComponent;
