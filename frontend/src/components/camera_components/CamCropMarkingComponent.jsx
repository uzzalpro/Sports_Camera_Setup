import React, { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import styles from "../../styles/CamCropMarkingComponent.module.css";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";
import Draggable from "react-draggable";
import { AppContext } from "../../context/AppContext";

const CamCropMarkingComponent = () => {
  const cropRefs = useRef({});
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const { imageSize, setImageSize, cropData, currentCamId, imageURL } = useContext(AppContext);

  const [crops, setCrops] = useState([]);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  // Updated handleDrag to sync with resize changes
  const handleDrag = (crop, data) => {
    const width = crop.bottom_right_x - crop.top_left_x;
    const height = crop.bottom_right_y - crop.top_left_y;

    setCrops((prev) =>
      prev.map((prevCrop) =>
        prevCrop === crop
          ? {
              ...prevCrop,
              top_left_x: Math.max(0, Math.min(data.x, displaySize.width - width)),
              top_left_y: Math.max(0, Math.min(data.y, displaySize.height - height)),
              bottom_right_x: Math.max(width, Math.min(data.x + width, displaySize.width)),
              bottom_right_y: Math.max(height, Math.min(data.y + height, displaySize.height)),
            }
          : prevCrop
      )
    );
  };

  // Updated handleResize function with bounds checking
  const handleResize = (crop, e, data) => {
    const { size, handle } = data;

    setCrops((prev) =>
      prev.map((prevCrop) => {
        if (prevCrop !== crop) return prevCrop;

        let newCrop = { ...prevCrop };

        // Calculate new coordinates based on which handle is being dragged
        switch (handle) {
          case "se": // bottom-right (default behavior)
            newCrop.bottom_right_x = Math.min(newCrop.top_left_x + size.width, displaySize.width);
            newCrop.bottom_right_y = Math.min(newCrop.top_left_y + size.height, displaySize.height);
            break;
          case "sw": // bottom-left
            newCrop.top_left_x = Math.max(0, newCrop.bottom_right_x - size.width);
            newCrop.bottom_right_y = Math.min(newCrop.top_left_y + size.height, displaySize.height);
            break;
          case "ne": // top-right
            newCrop.bottom_right_x = Math.min(newCrop.top_left_x + size.width, displaySize.width);
            newCrop.top_left_y = Math.max(0, newCrop.bottom_right_y - size.height);
            break;
          case "nw": // top-left
            newCrop.top_left_x = Math.max(0, newCrop.bottom_right_x - size.width);
            newCrop.top_left_y = Math.max(0, newCrop.bottom_right_y - size.height);
            break;
          case "n": // top
            newCrop.top_left_y = Math.max(0, newCrop.bottom_right_y - size.height);
            break;
          case "s": // bottom
            newCrop.bottom_right_y = Math.min(newCrop.top_left_y + size.height, displaySize.height);
            break;
          case "w": // left
            newCrop.top_left_x = Math.max(0, newCrop.bottom_right_x - size.width);
            break;
          case "e": // right
            newCrop.bottom_right_x = Math.min(newCrop.top_left_x + size.width, displaySize.width);
            break;
          default:
            newCrop.bottom_right_x = Math.min(newCrop.top_left_x + size.width, displaySize.width);
            newCrop.bottom_right_y = Math.min(newCrop.top_left_y + size.height, displaySize.height);
        }

        return newCrop;
      })
    );
  };

  // Adds a new crop to the crops list on mouse position
  const handleImageClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, displaySize.width - 100));
    const y = Math.max(0, Math.min(e.clientY - rect.top, displaySize.height - 100));

    setCrops((prev) => [
      ...prev,
      {
        top_left_x: x,
        top_left_y: y,
        bottom_right_x: Math.min(x + 100, displaySize.width),
        bottom_right_y: Math.min(y + 100, displaySize.height),
      },
    ]);
  };

  // Delete a crop from the crops list using it's key and reindex the list
  const deleteCrop = (e, crop) => {
    if (e.shiftKey) {
      setCrops((prev) => prev.filter((prevCrop) => prevCrop !== crop));
    }
  };

  // Normalize crop coordinates for backend storage (convert from display to actual image coordinates)
  const normalizeCrops = (crops) => {
    if (displaySize.width === 0 || displaySize.height === 0 || imageSize.width === 0 || imageSize.height === 0) {
      return crops;
    }

    const scaleX = imageSize.width / displaySize.width;
    const scaleY = imageSize.height / displaySize.height;

    return crops.map((crop) => ({
      top_left_x: (crop.top_left_x * scaleX) / imageSize.width,
      top_left_y: (crop.top_left_y * scaleY) / imageSize.height,
      bottom_right_x: (crop.bottom_right_x * scaleX) / imageSize.width,
      bottom_right_y: (crop.bottom_right_y * scaleY) / imageSize.height,
    }));
  };

  // Denormalize crop coordinates from backend (convert from normalized to display coordinates)
  const denormalizeCrops = (normalizedCrops) => {
    if (displaySize.width === 0 || displaySize.height === 0 || imageSize.width === 0 || imageSize.height === 0) {
      return [];
    }

    const scaleX = displaySize.width / imageSize.width;
    const scaleY = displaySize.height / imageSize.height;

    return normalizedCrops.map((crop) => ({
      top_left_x: crop.top_left_x * imageSize.width * scaleX,
      top_left_y: crop.top_left_y * imageSize.height * scaleY,
      bottom_right_x: crop.bottom_right_x * imageSize.width * scaleX,
      bottom_right_y: crop.bottom_right_y * imageSize.height * scaleY,
    }));
  };

  // Send crops to backend
  const sendCrops = (crops) => {
    if (!isInitialized) return;
    
    const normalized = normalizeCrops(crops);
    try {
      axios.put(
        `${import.meta.env.VITE_API_URL}/api/camera/${currentCamId}/crop`,
        normalized
      );
    } catch (error) {
      console.error("Error sending crops to backend:", error);
      alert("Failed to save crops. Please try again later.");
    }
  };

  const resetCrops = () => {
    setCrops([]);
  };

  // Update display size when image loads or window resizes
  const updateDisplaySize = () => {
    const img = imageRef.current;
    if (img && img.complete) {
      setDisplaySize({
        width: img.offsetWidth,
        height: img.offsetHeight
      });
    }
  };

  // Send crops 1 second after changing one - only when user actively modifies them
  useEffect(() => {
    let timeout;
    if (isInitialized && crops.length >= 0) {
      timeout = setTimeout(() => {
        sendCrops(crops);
      }, 1000);
    }
    return () => clearTimeout(timeout);
  }, [crops, isInitialized]);

  // Update actual image size and display size
  useEffect(() => {
    if (!imageURL) return;
    
    const img = imageRef.current;
    const setSize = () => {
      if (img && img.complete) {
        // Set actual image dimensions
        setImageSize({ 
          width: img.naturalWidth, 
          height: img.naturalHeight 
        });
        // Update display size
        updateDisplaySize();
      }
    };

    if (img && img.complete) {
      setSize();
    } else if (img) {
      img.onload = setSize;
    }

    return () => {
      if (img) img.onload = null;
    };
  }, [imageURL, setImageSize]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateDisplaySize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize crops from backend data only once when component mounts or camera changes
  useEffect(() => {
    if (
      cropData &&
      cropData.length > 0 &&
      imageSize.width > 1 &&
      imageSize.height > 1 &&
      displaySize.width > 0 &&
      displaySize.height > 0
    ) {
      if (!isInitialized) {
        const denormalized = denormalizeCrops(cropData);
        setCrops(denormalized);
        setIsInitialized(true);
      }
    } else if (
      (!cropData || cropData.length === 0) &&
      imageSize.width > 1 &&
      imageSize.height > 1 &&
      displaySize.width > 0 &&
      displaySize.height > 0
    ) {
      // If no backend data, just mark as initialized with empty crops
      if (!isInitialized) {
        setCrops([]);
        setIsInitialized(true);
      }
    }
  }, [cropData, imageSize.width, imageSize.height, displaySize.width, displaySize.height, isInitialized]);

  // Reset initialization flag when camera changes
  useEffect(() => {
    setCrops([]); // Clear crops when camera changes
    setIsInitialized(false);
  }, [currentCamId]);

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        <h1 className={styles.title}>Crop Marking</h1>

        <div className={styles.topSection}>
          <div className={styles.instructionsSection}>
            <h2 className={styles.instructionsTitle}>Instructions</h2>
            <div className={styles.instructionsList}>
              <p>Double click to add a crop.</p>
              <p>Drag the corner to resize a crop.</p>
              <p>Hold shift and click to delete a crop.</p>
            </div>
          </div>

          <div className={styles.statusSection}>
            <div className={`${styles.statusBadge} ${crops.length > 0 ? styles.done : styles.notDone}`}>
              Crops: {crops.length > 0 ? `${crops.length} defined` : "None"}
            </div>
          </div>
        </div>

        <div className={styles.controlsSection}>
          <h2 className={styles.fieldTitle}>Active Crops: {crops.length}</h2>
          
          <div className={styles.buttonGroup}>
            <button
              onClick={resetCrops}
              disabled={crops.length === 0}
              className={`${styles.button} ${crops.length > 0 ? styles.resetActive : styles.resetInactive}`}
            >
              Reset Crops
            </button>
          </div>
        </div>

        <div className={styles.imageContainer}>
          <div className={styles.imgContainer}>
            <img
              ref={imageRef}
              className={styles.img}
              id="crop-img"
              src={imageURL}
              alt="Image for crop marking"
              onDoubleClick={handleImageClick}
              onLoad={updateDisplaySize}
            />

            {/* List of crops mapped as a ResizableBox component wrapped in a Draggable component */}
            {displaySize.width > 0 && displaySize.height > 0 && crops.map((crop, index) => {
              if (!cropRefs.current[index]) {
                cropRefs.current[index] = React.createRef();
              }
              const nodeRef = cropRefs.current[index];

              const width = crop.bottom_right_x - crop.top_left_x;
              const height = crop.bottom_right_y - crop.top_left_y;

              return (
                <Draggable
                  nodeRef={nodeRef}
                  key={index}
                  bounds="parent"
                  position={{ x: crop.top_left_x, y: crop.top_left_y }}
                  onStop={(_, data) => handleDrag(crop, data)}
                  cancel=".react-resizable-handle"
                >
                  <div
                    ref={nodeRef}
                    className={styles.draggable}
                    onClick={(e) => deleteCrop(e, crop)}
                    data-testid={`draggable-${index}`}
                    style={{ position: "absolute" }}
                  >
                    <Resizable
                      width={width}
                      height={height}
                      minConstraints={[50, 50]}
                      maxConstraints={[
                        displaySize.width - crop.top_left_x,
                        displaySize.height - crop.top_left_y,
                      ]}
                      resizeHandles={["n", "s", "e", "w", "ne", "nw", "se", "sw"]}
                      onResize={handleResize.bind(null, crop)}
                    >
                      <div
                        style={{
                          width: width + "px",
                          height: height + "px",
                          border: "2px solid #00ff00",
                          backgroundColor: "rgba(0, 255, 0, 0.2)",
                          boxSizing: "border-box",
                        }}
                      />
                    </Resizable>
                  </div>
                </Draggable>
              );
            })}
          </div>
        </div>

        <div className={styles.infoSection}>
          <p>
            Crops: {crops.length} • 
            Display: {displaySize.width}x{displaySize.height} • 
            Actual: {imageSize.width}x{imageSize.height}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CamCropMarkingComponent;