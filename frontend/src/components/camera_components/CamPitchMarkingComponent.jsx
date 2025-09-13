import { useContext, useEffect, useRef, useState } from "react";
import { Circle, Layer, Line, Stage } from "react-konva";
import styles from "../../styles/CamPitchMarkingComponent.module.css";
import axios from "axios";
import { AppContext } from "../../context/AppContext";

const CamPitchMarkingComponent = () => {
  const imgRef = useRef(null);
  const stageRef = useRef(null);
  const [showInner, setShowInner] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  const { 
    imageURL, 
    setImageSize, 
    imageSize, 
    innerPoints, 
    setInnerPoints, 
    outerPoints, 
    setOuterPoints, 
    currentCamId, 
    allCamConfig 
  } = useContext(AppContext);

  // Toggles a boolean used to differentiate inner- and outerfield
  const toggleField = () => {
    setShowInner(!showInner);
  };

  // Update coordinates of a certain point in the point list
  const handleDragMove = (index, e, points, setPoints) => {
    const circle = e.target;
    const x = Math.max(0, Math.min(e.target.x(), displaySize.width));
    const y = Math.max(0, Math.min(e.target.y(), displaySize.height));

    circle.position({ x, y });

    const newPoints = [...points];
    newPoints[index] = { x, y };
    setPoints(newPoints);
  };

  // Add a new point to the point list when we click the canvas
  const handleCanvasClick = (points, setPoints) => {
    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();
    const { x, y } = pointerPos;

    let minDist = Infinity;
    let insertIndex = 0;

    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];

      const dist = pointToSegmentDistance(x, y, a, b);
      if (dist < minDist) {
        minDist = dist;
        insertIndex = i + 1;
      }
    }

    const newPoints = [...points];
    newPoints.splice(insertIndex, 0, { x, y });
    setPoints(newPoints);
  };

  const pointToSegmentDistance = (px, py, a, b) => {
    const A = px - a.x;
    const B = py - a.y;
    const C = b.x - a.x;
    const D = b.y - a.y;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    const param = len_sq !== 0 ? dot / len_sq : -1;

    let xx, yy;

    if (param < 0) {
      xx = a.x;
      yy = a.y;
    } else if (param > 1) {
      xx = b.x;
      yy = b.y;
    } else {
      xx = a.x + param * C;
      yy = a.y + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleDeletePointClick = (e, index, points, setPoints) => {
    if (e.evt.shiftKey) {
      const newPoints = [...points];
      newPoints.splice(index, 1);
      setPoints(newPoints);
    }
  };

  // Normalize points based on ACTUAL image dimensions (for backend storage)
  const normalizePoints = (points) => {
    if (displaySize.width === 0 || displaySize.height === 0 || imageSize.width === 0 || imageSize.height === 0) {
      return points;
    }
    
    // Convert display coordinates to actual image coordinates, then normalize
    const scaleX = imageSize.width / displaySize.width;
    const scaleY = imageSize.height / displaySize.height;
    
    return points.map((pt) => ({
      x: (pt.x * scaleX) / imageSize.width,
      y: (pt.y * scaleY) / imageSize.height,
    }));
  };

  // Denormalize points from actual image dimensions to display dimensions
  const denormalizePoints = (points) => {
    if (displaySize.width === 0 || displaySize.height === 0 || imageSize.width === 0 || imageSize.height === 0) {
      return [];
    }
    
    // Convert normalized coordinates to actual image coordinates, then to display coordinates
    const scaleX = displaySize.width / imageSize.width;
    const scaleY = displaySize.height / imageSize.height;
    
    return points.map((pt) => ({
      x: (pt.x * imageSize.width) * scaleX,
      y: (pt.y * imageSize.height) * scaleY,
    }));
  };

  const resetPoints = () => {
    setActivePoints([]);
  };

  const sendPoints = (inPts, outPts) => {
    console.log("Sending points to backend:");
    console.log("Display points - Inner:", inPts);
    console.log("Display points - Outer:", outPts);
    
    const normInner = normalizePoints(inPts);
    const normOuter = normalizePoints(outPts);
    
    console.log("Normalized points - Inner:", normInner);
    console.log("Normalized points - Outer:", normOuter);
    
    try {
      axios.put(`${import.meta.env.VITE_API_URL}/api/camera/${currentCamId}/pitch`, [normInner, normOuter]);
    } catch (error) {
      console.error("Error sending points to backend:", error);
      alert("Failed to save points. Please try again later.");
      return;
    }
  };

  // Update display size when image loads or window resizes
  const updateDisplaySize = () => {
    const img = imgRef.current;
    if (img && img.complete) {
      const rect = img.getBoundingClientRect();
      setDisplaySize({
        width: img.offsetWidth,
        height: img.offsetHeight
      });
    }
  };

  // Only send points when user actively modifies them (not during initialization)
  useEffect(() => {
    let timeout;
    if (isInitialized){
      timeout = setTimeout(() => {
        sendPoints(innerPoints, outerPoints);
      }, 1000);
    }
    return () => clearTimeout(timeout);
  }, [innerPoints, outerPoints, isInitialized]);

  // Update actual image size and display size
  useEffect(() => {
    const img = imgRef.current;
    const updateImgSize = () => {
      if (img && img.complete) {
        // Set actual image dimensions
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        // Update display size
        updateDisplaySize();
      }
    };

    if (!img) return;
    
    if (img.complete) {
      updateImgSize();
    } else {
      img.addEventListener("load", updateImgSize);
      return () => img.removeEventListener("load", updateImgSize);
    }
  }, [imageURL, setImageSize]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateDisplaySize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize points from backend data only once when component mounts or camera changes
  useEffect(() => {
    if (
      allCamConfig.innerPoints &&
      allCamConfig.outerPoints &&
      imageSize.width > 0 &&
      imageSize.height > 0 &&
      displaySize.width > 0 &&
      displaySize.height > 0
    ) {
      // Only initialize if we don't have points or if this is a fresh load
      if (innerPoints.length === 0 && outerPoints.length === 0) {
        console.log("Initializing points from backend:");
        console.log("Backend inner points:", allCamConfig.innerPoints);
        console.log("Backend outer points:", allCamConfig.outerPoints);
        console.log("Image size:", imageSize);
        console.log("Display size:", displaySize);
        
        const denormalizedInner = denormalizePoints(allCamConfig.innerPoints);
        const denormalizedOuter = denormalizePoints(allCamConfig.outerPoints);
        
        console.log("Denormalized inner points:", denormalizedInner);
        console.log("Denormalized outer points:", denormalizedOuter);

        setInnerPoints(denormalizedInner);
        setOuterPoints(denormalizedOuter);
        setIsInitialized(true);
      }
    }
  }, [
    allCamConfig.innerPoints,
    allCamConfig.outerPoints,
    imageSize.width,
    imageSize.height,
    displaySize.width,
    displaySize.height,
  ]);

  // Reset initialization flag when camera changes
  useEffect(() => {
    setIsInitialized(false);
    setInnerPoints([]);
    setOuterPoints([]);
  }, [currentCamId, setInnerPoints, setOuterPoints]);

  const activePoints = showInner ? innerPoints : outerPoints;
  const setActivePoints = showInner ? setInnerPoints : setOuterPoints;
  const strokeColor = showInner ? "#facc15" : "#3b82f6";

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        {/* Title */}
        <h1 className={styles.title}>Pitch Marking</h1>

        {/* Instructions and Status */}
        <div className={styles.topSection}>
          <div className={styles.instructionsSection}>
            <h2 className={styles.instructionsTitle}>Instructions</h2>
            <div className={styles.instructionsList}>
              <p>Double click to add a point.</p>
              <p>Drag to move a point.</p>
              <p>Hold shift and click to delete a point.</p>
            </div>
          </div>

          <div className={styles.statusSection}>
            <div
              className={`${styles.statusBadge} ${
                innerPoints.length >= 4 ? styles.done : styles.notDone
              }`}
            >
              Inner Field: {innerPoints.length >= 4 ? "Done" : "Not Done"}
            </div>
            <div
              className={`${styles.statusBadge} ${
                outerPoints.length >= 4 ? styles.done : styles.notDone
              }`}
            >
              Outer Field: {outerPoints.length >= 4 ? "Done" : "Not Done"}
            </div>
          </div>
        </div>

        {/* Field Selection and Controls */}
        <div className={styles.controlsSection}>
          <h2 className={styles.fieldTitle}>
            {showInner ? "Inner Field" : "Outer Field"}
          </h2>

          <div className={styles.buttonGroup}>
            <button
              onClick={toggleField}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              {showInner ? "Show Outer" : "Show Inner"}
            </button>
            <button
              onClick={resetPoints}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              Reset Points
            </button>
          </div>
        </div>

        {/* Image and Canvas Container */}
        <div className={styles.imageContainer}>
          <div className={styles.imageWrapper}>
            <img
              ref={imgRef}
              src={imageURL}
              alt="Football pitch for marking"
              className={styles.img}
              onLoad={updateDisplaySize}
            />
            {displaySize.width > 0 && displaySize.height > 0 && (
              <Stage
                ref={stageRef}
                className={styles.polygon}
                width={displaySize.width}
                height={displaySize.height}
                onDblClick={() =>
                  handleCanvasClick(activePoints, setActivePoints)
                }
              >
                <Layer>
                  <Line
                    points={activePoints.flatMap((p) => [p.x, p.y])}
                    closed
                    stroke={strokeColor}
                    strokeWidth={3}
                    opacity={0.8}
                  />
                  {activePoints.map((point, index) => (
                    <Circle
                      key={index}
                      x={point.x}
                      y={point.y}
                      radius={6}
                      fill="#ef4444"
                      stroke="white"
                      strokeWidth={2}
                      draggable
                      onDragMove={(e) =>
                        handleDragMove(index, e, activePoints, setActivePoints)
                      }
                      onClick={(e) =>
                        handleDeletePointClick(
                          e,
                          index,
                          activePoints,
                          setActivePoints
                        )
                      }
                      onMouseEnter={(e) => {
                        e.target.scale({ x: 1.2, y: 1.2 });
                        e.target.getLayer().batchDraw();
                      }}
                      onMouseLeave={(e) => {
                        e.target.scale({ x: 1, y: 1 });
                        e.target.getLayer().batchDraw();
                      }}
                    />
                  ))}
                </Layer>
              </Stage>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className={styles.infoSection}>
          <p>
            Points: {activePoints.length} • Current field:{" "}
            {showInner ? "Inner" : "Outer"}
          </p>
          <p>
            Display: {displaySize.width}x{displaySize.height} • 
            Actual: {imageSize.width}x{imageSize.height}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CamPitchMarkingComponent;
