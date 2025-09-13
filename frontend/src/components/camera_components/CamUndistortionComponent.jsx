import axios from "axios"
import { useContext, useEffect, useRef, useState } from "react"
import Draggable from "react-draggable"
import { applyUndistortion } from "../../scripts/homography-undistortion"
import styles from "../../styles/CamUndistortionComponent.module.css"
import Tooltip from "../../components/Tooltip"
import { AppContext } from "../../context/AppContext"

const CamUndistortionComponent = () => {
  const nodeRef = useRef(null)  // Replaces findDomNode needed for draggable components
  const imageContainerRef = useRef(null) // Reference for the image container

  const {currentCamId, imageURL, imageSize, setImageSize, undParams, hgSrcPts, hgDstPts} = useContext(AppContext)
  
  // New refs to replace document.getElementById calls
  const pointImgRef = useRef(null)
  const dstImgRef = useRef(null)
  const distortionCanvRef = useRef(null)
  const hgDestinationCanvRef = useRef(null)
  
  const [toggleImg, setToggleImg] = useState(true)
  const [importedImg, setImportedImg] = useState(null)
  const [redraw, setRedraw] = useState(false)
  // Added zoom and pan state 
  const [zoom, setZoom] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  // Default parameters for comparison
  const defaultParameters = {
    "x": "50",
    "y": "50",
    "w": "50",
    "h": "50",
    "k1": "0",
    "k2": "0",
    "p1": "0",
    "p2": "0",
    "k3": "0",
    "zoom": "0"
  }
  const [parameters, setParameters] = useState(defaultParameters)
  const [paramRanges, setParamRanges] = useState({
    "x": {min: "0", max: "100"},
    "y": {min: "0", max: "100"},
    "w": {min: "0", max: "100"},
    "h": {min: "0", max: "100"},
    "k1": {min: "-1", max: "1"},
    "k2": {min: "-1", max: "1"},
    "p1": {min: "-1", max: "1"},
    "p2": {min: "-1", max: "1"},
    "k3": {min: "-1", max: "1"},
    "zoom": {min: "-10", max: "10"}
  })
  const [sourcePoints, setSourcePoints] = useState({
    "1": {x: 466, y: 120},
    "2": {x: 829, y: 104},
    "3": {x: 789, y: 467},
    "4": {x: 28, y: 290}
  })
  const [destinationPoints, setDestinationPoints] = useState({
    "1": {x: 25, y: 21},
    "2": {x: 427, y: 21},
    "3": {x: 427, y: 453},
    "4": {x: 25, y: 453}
  })

  const infoText = {
    x: "Horizontal position offset for the camera calibration center",
    y: "Vertical position offset for the camera calibration center", 
    w: "Width scaling factor for the undistortion region",
    h: "Height scaling factor for the undistortion region",
    k1: "Radial distortion coefficient (barrel/pincushion distortion)",
    k2: "Second radial distortion coefficient for higher-order corrections",
    p1: "Tangential distortion coefficient (horizontal decentering)",
    p2: "Tangential distortion coefficient (vertical decentering)",
    k3: "Third radial distortion coefficient for severe distortions",
    zoom: "Digital zoom factor applied after undistortion"
  }

  // Check if parameters have been changed from default
  const hasParametersChanged = () => {
    return Object.keys(parameters).some(key => parameters[key] !== defaultParameters[key])
  }

  // Pan and Zoom Event Handlers using mouse wheel
  const handleWheel = (e) => {
    if (!toggleImg) return  // Only allow zoom when showing points
    
    e.preventDefault()
    const rect = imageContainerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.5, Math.min(5, zoom.scale * scaleFactor))
    
    // Calculate new position to zoom towards mouse cursor
    const newX = mouseX - (mouseX - zoom.x) * (newScale / zoom.scale)
    const newY = mouseY - (mouseY - zoom.y) * (newScale / zoom.scale)
    
    setZoom({ x: newX, y: newY, scale: newScale })
  }
  const handleMouseDown = (e) => {
    if (!toggleImg) return  // Only allow pan when showing points
    // Check if the mouse down is on a draggable dot or its children
    if (e.target.closest('.draggable-dot')) return // Don't interfere with draggable dots
    if (isDragging) return  // Don't start panning if already dragging a point
    
    setIsPanning(true)
    setLastPanPoint({ x: e.clientX, y: e.clientY })
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isPanning || !toggleImg || isDragging) return
    
    const deltaX = e.clientX - lastPanPoint.x
    const deltaY = e.clientY - lastPanPoint.y
    
    setZoom(prev => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }))
    
    setLastPanPoint({ x: e.clientX, y: e.clientY })
  }
  const handleMouseUp = () => {
    setIsPanning(false)
  }
  const resetZoom = () => {
    setZoom({ x: 0, y: 0, scale: 1 })
  }
  // Adjust draggable point positions based on zoom and pan
  const getAdjustedPointPosition = (point) => {
    return {
      x: point.x * zoom.scale + zoom.x,
      y: point.y * zoom.scale + zoom.y
    }
  }
  // Convert screen coordinates back to image coordinates for draggable points
  const getImageCoordinates = (screenX, screenY) => {
    return {
      x: (screenX - zoom.x) / zoom.scale,
      y: (screenY - zoom.y) / zoom.scale
    }
  }

  // Updates the parameters dictionary useState for every change to any parameter
  const handleParamChange = (key, e) => {
    setParameters(prevParams => ({
      ...prevParams,
      [key]: (e.target.value)
    }))
  }

  // Updates the minimum or maximum range of the parameter
  const handleParamRangeChange = (key, rangeType, e) => {
    setParamRanges(prevRanges => ({
      ...prevRanges,
      [key]: {
        ...prevRanges[key],
        [rangeType]: e.target.value
      }
    }))
  }

  const resetParams = () => {
    setParameters({...defaultParameters})
  }

  // Toggle between point image and undistortion canvas
  const handleToggleImg = () => {
    setToggleImg(!toggleImg)
  }

  // Changes the point coordinates through the number input field
  const handlePointChange = (direction, type, key, data) => {
    const value = data === "" ? null : Number(data)
    
    if (direction == "source") {
      setSourcePoints((prev) => ({
        ...prev,
        [key]: {...prev[key], [type]: value}
      }))
    }

    if (direction == "destination") {
      setDestinationPoints((prev) => ({
        ...prev,
        [key]: {...prev[key], [type]: value}
      }))
    }
  }

  // Updates the position of the source points when one's dragged
  const handleSrcDrag = (key, data) => {
    //The selection should not rely on the image, the selection should never be outside
    //the image, so the image coordinates are calculated based on the current zoom and pan state
    const imageCoords = getImageCoordinates(data.x, data.y)
    setSourcePoints((prev) => ({
      ...prev,
      [key]: {x: imageCoords.x, y: imageCoords.y}
    }))
  }

  // Updates the position of the destination points when one's dragged
  const handleDstDrag = (key, data) => {
    setDestinationPoints((prev) => ({
      ...prev,
      [key]: {x: data.x, y: data.y}
    }))
  }

  // Handle drag start for source points
  const handleSrcDragStart = (e) => {
    setIsDragging(true)
    // Stop event propagation to prevent Zoom from starting
    e.stopPropagation()
  }

  // Handle drag stop for source points
  const handleSrcDragStop = () => {
    setIsDragging(false)
  }

  // FIXED: Formats a point dictionary to normalized value
  const formatPoints = (points, displayedImgEl) => {
    if (!displayedImgEl || !importedImg) return points
    
    const formattedPoints = structuredClone(points)
    Object.values(formattedPoints).forEach((point) => {
      point.x = (point.x + 5) * importedImg.width / displayedImgEl.width
      point.y = (point.y + 5) * importedImg.height / displayedImgEl.height
    })
    return formattedPoints
  }

  // Normalize set of homography points
  const normalizePoints = (points, imageEl) => {
    if (!imageEl) return points
    
    const normPoints = structuredClone(points)
    const width = imageEl.naturalWidth
    const height = imageEl.naturalHeight
  
    Object.values(normPoints).forEach(point => {
      point.x = point.x / width
      point.y = point.y / height
    })
    return normPoints
  }

  // Denormalize set of homgraphy points
  const denormalizePoints = (points, imageEl) => {
    if (!imageEl) return points
    
    const denormPoints = structuredClone(points)
    const width = imageEl.naturalWidth
    const height = imageEl.naturalHeight
  
    Object.values(denormPoints).forEach(point => {
      point.x = point.x * width
      point.y = point.y * height
    })
    return denormPoints
  }

  // Send undistortion parameter values to backend
  const sendUndParams = async (undParams) => {
    await axios.put(`${import.meta.env.VITE_API_URL}/api/camera/${currentCamId}/undistortion`, undParams)
  }

  // Send normalized homography point values to backend
  const sendHgPoints = async (srcPts, dstPts) => {
    const srcImg = pointImgRef.current
    const dstImg = dstImgRef.current
  
    if (!srcImg || !dstImg) return
    
    const normSrc = normalizePoints(srcPts, srcImg)
    const normDst = normalizePoints(dstPts, dstImg)
    
    await axios.put(`${import.meta.env.VITE_API_URL}/api/camera/${currentCamId}/homography`, [normSrc, normDst])
  }

  // Send undistortion parameters 1 second after changing one
  useEffect(() => {
    const timeout = setTimeout(() => {
      sendUndParams(parameters)
    }, 1000)
    return () => clearTimeout(timeout)
  }, [parameters])

  // Send homography points 1 second after changing one
  useEffect(() => {
    const timeout = setTimeout(() => {
      sendHgPoints(sourcePoints, destinationPoints)
    }, 1000)
    return () => clearTimeout(timeout)
  }, [sourcePoints, destinationPoints])

  // useEffect for getting config values on load
  useEffect(() => {
    if (undParams && hgSrcPts && hgDstPts && imageSize.width > 1 && imageSize.height > 1) {
      const srcImg = pointImgRef.current
      const dstImg = dstImgRef.current
    
      if (!srcImg || !dstImg) return
      
      setParameters(undParams)
      setSourcePoints(denormalizePoints(hgSrcPts, srcImg))
      setDestinationPoints(denormalizePoints(hgDstPts, dstImg))
    }
  }, [undParams, hgSrcPts, hgDstPts, imageSize])
  
  // Load image and set its size
  useEffect(() => {
    if (!imageURL) return
    const img = new Image()
    img.src = imageURL
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
      setImportedImg(img)
    }
  }, [imageURL])

  // Clear canvas on image change
  useEffect(() => {
    const dstCanv = hgDestinationCanvRef.current
    if (dstCanv && dstCanv.getContext) {
      const ctx = dstCanv.getContext("2d")
      ctx.clearRect(0, 0, dstCanv.width, dstCanv.height)
    }
  }, [imageURL])  

  // Add event listeners for pan and zoom
  useEffect(() => {
    const container = imageContainerRef.current
    if (!container) return

    const handleMouseMoveGlobal = (e) => handleMouseMove(e)
    const handleMouseUpGlobal = () => handleMouseUp()

    container.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('mousemove', handleMouseMoveGlobal)
    document.addEventListener('mouseup', handleMouseUpGlobal)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      document.removeEventListener('mousemove', handleMouseMoveGlobal)
      document.removeEventListener('mouseup', handleMouseUpGlobal)
    }
  }, [isPanning, lastPanPoint, zoom, toggleImg, isDragging])

  // FIXED: useEffect needed or changes to parameters aren't synced with the script files
  useEffect(() => {
    // Loading guards
    if (typeof cv === "undefined") return
    if (!importedImg) return
    const displayedSrc = pointImgRef.current
    const displayedDst = dstImgRef.current
    if (!displayedSrc || !displayedDst) return
    if (displayedSrc.width === 0 || displayedDst.width === 0) return

    // Only run the function once every second
    const timeout = setTimeout(() => {
      const run = async () => {
        // Copied variables to avoid sync conflicts
        const copiedParameters = {...parameters}
        // FIXED: Pass the actual image elements instead of display parameters
        const copiedSourcePoints = formatPoints(sourcePoints, displayedSrc)
        const copiedDestinationPoints = formatPoints(destinationPoints, displayedDst)

        await applyUndistortion(copiedParameters, copiedSourcePoints, copiedDestinationPoints, importedImg)
      }

      run()
    }, 1000)
  
    return () => clearTimeout(timeout)
  }, [parameters, sourcePoints, destinationPoints, redraw])

  return (
    <div>
      <h2>Homography & Undistortion</h2>

      <div className={styles.content}>
        <div className={styles.sliderContainer} id="sliders">
          {/* Check weather the parameters have been changed from default to enable or disable the Reset Params button */}
          {/* If not changed, the button is disabled */}
          <button 
            className={`${styles.btn} ${!hasParametersChanged() ? styles.btnDisabled : ''}`}
            onClick={resetParams}
            disabled={!hasParametersChanged()}
          >
            Reset Params
          </button>

          {/* Every key and value of the parameters dictionary mapped as an input slider with a label */}
          {Object.entries(parameters).map(([key]) =>
            <div key={key}>
              <div className={styles.paramRow}>
                <Tooltip content={infoText[key]} position="right">
                  <label htmlFor={key}>{key}:</label>
                </Tooltip>
                <input type="number" value={parameters[key]} 
                  step={["x", "y", "w", "h"].includes(key) ? 0.5 : 0.01}
                  onChange={(e) => handleParamChange(key, e)}/>
              </div>
              {/* Every slider has its own min and max inputfield */}
              <div className={styles.paramSlider}>
                {/* Min range inputfield */}
                <label htmlFor={key}>Min:
                  <input data-testid={`min-input-${key}`} type="text" value={paramRanges[key].min} onChange={(e) => handleParamRangeChange(key, "min", e)} />
                </label>

                {/* Slider inputfield range */}
                <input 
                  type="range"
                  min={paramRanges[key].min}
                  max={paramRanges[key].max}
                  step={["x", "y", "w", "h"].includes(key) 
                  ? 0.5  // These values use 0.5 as step
                  : (parseFloat(paramRanges[key].max) - parseFloat(paramRanges[key].min)) / 200}  // Formula to get a consistent step of 200
                  id={key}
                  value={parameters[key]}
                  onChange={(e) => handleParamChange(key, e)}
                  data-testid={`slider-${key}`}
                />

                {/* Max range inputfield */}
                <label htmlFor={key}>Max:
                  <input data-testid={`max-input-${key}`} type="text" value={paramRanges[key].max} onChange={(e) => handleParamRangeChange(key, "max", e)} />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Images and canvases for homography and undistortion aswell as functionality buttons */}
        <div className={styles.imageContainer}>
          {/* Instructions for the user */}
          <p>Drag the points on the image and adjust with the coordinate boxes. Use mouse wheel to zoom, click and drag to pan.</p>
          <div className={styles.buttonContainer}>
            <button className={styles.btn} onClick={handleToggleImg}>
              {toggleImg ? "Show Undistortion" : "Show Points"}
            </button>
            <button className={styles.btn} onClick={() => setRedraw(!redraw)}>
              Redraw Img
            </button>
            <button className={styles.btn} onClick={resetZoom}>
              Reset Zoom
            </button>
            <span style={{ marginLeft: '10px' }}>Zoom: {(zoom.scale * 100).toFixed(0)}%</span>
          </div>

          {/* Shows either the point image or the undistortion canvas depending on the toggleImg state */}
          <div 
            className={styles.sourceImgContainer}
            ref={imageContainerRef}
            onMouseDown={handleMouseDown}
            style={{ 
              overflow: 'hidden', 
              position: 'relative',
              cursor: isPanning ? 'grabbing' : (toggleImg ? 'grab' : 'default'),
              userSelect: 'none'
            }}
          >
            <img 
              ref={pointImgRef}
              src={imageURL} 
              alt="source-image"
              id="pointImg"
              style={{
                opacity: toggleImg ? "1" : "0",
                transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
                transformOrigin: "0 0",
                transition: isPanning ? "none" : "transform 0.1s ease-out",
                userSelect: "none",
                pointerEvents: "none"
              }}
              draggable={false}
            />
            <canvas 
              ref={distortionCanvRef}
              id="distortionCanv"
              style={{
                opacity: toggleImg ? "0" : "1",
                transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
                transformOrigin: "0 0"
              }}
            />
            
            {/* Make draggable components on the source image from the sourcePoints dictionary */}
            {toggleImg && Object.entries(sourcePoints).map(([key, value]) => {
              const adjustedPosition = getAdjustedPointPosition(value)
              return (
                <Draggable
                  nodeRef={nodeRef} 
                  key={key} 
                  className={`${styles.draggableDots} draggable-dot`}
                  bounds={false} // Remove bounds to allow dragging with zoom/pan
                  position={adjustedPosition}
                  onStart={handleSrcDragStart}
                  onStop={handleSrcDragStop}
                  onDrag={(_, data) => handleSrcDrag(key, data)}
                >
                  <div 
                    ref={nodeRef} 
                    className={styles.dstDot}
                    style={{ 
                      transform: `scale(${1/zoom.scale})`, // Keep dot size constant
                      transformOrigin: 'center',
                      cursor: 'cursor'
                    }}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent pan when clicking on dot
                  >
                    {key}
                  </div>
                </Draggable>
              )
            })}
          </div>

          {/* Shows points layered on the homography image, layered on the destination image */}
          <div className={styles.dstImgContainer}>
            <img ref={dstImgRef} src="/dst_img_voor_functie.png" alt="destination-image" id="dstImg" />
            <canvas ref={hgDestinationCanvRef} id="hgDestinationCanv"></canvas>
            {/* Make draggable components on the destination image from the destinationPoints dictionary */}
            {Object.entries(destinationPoints).map(([key, value]) => 
              <Draggable
                nodeRef={nodeRef} 
                key={key} 
                className={styles.draggableDots}
                bounds="parent"
                position={value}
                onDrag={(_, data) => handleDstDrag(key, data)}  // Data argument in DraggableComponent contains the position 
                >
                <div ref={nodeRef} className={styles.srcDot}>{key}</div>
              </Draggable>
            )}
          </div>
        </div>

        {/* number type input fields for more precise coordinate adjustment */}
        <div className={styles.coordinatesContainer}>
          {Object.entries(sourcePoints).map(([key]) =>
            <div className={styles.coordinateContainer} key={key}>
              <label htmlFor="">{key}</label><br />
              <input data-testid={`source-x-${key}`} type="number" className={styles.coordinate} 
                value={sourcePoints[key]["x"]} 
                onChange={(e) => handlePointChange("source", "x", key, e.target.value)}/>
              <input data-testid={`source-y-${key}`} type="number" className={styles.coordinate} 
                value={sourcePoints[key]["y"]} 
                onChange={(e) => handlePointChange("source", "y", key, e.target.value)}/>
            </div>
          )}
          {Object.entries(destinationPoints).map(([key]) => 
            <div className={styles.coordinateContainer} key={key}>
              <label htmlFor="">{key}</label><br />
              <input data-testid={`destination-x-${key}`} type="number" className={styles.coordinate} 
                value={destinationPoints[key]["x"]} 
                onChange={(e) => handlePointChange("destination", "x", key, e.target.value)}/>
              <input data-testid={`destination-y-${key}`} type="number" className={styles.coordinate} 
                value={destinationPoints[key]["y"]} 
                onChange={(e) => handlePointChange("destination", "y", key, e.target.value)}/>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CamUndistortionComponent