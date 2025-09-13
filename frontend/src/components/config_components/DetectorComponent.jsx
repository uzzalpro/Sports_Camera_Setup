import axios from "axios"
import { useEffect, useState } from "react"
import styles from "../../styles/ConfigurableComponent.module.css"
import Tooltip from "../Tooltip"

const DetectorComponent = ({ currentSetupId }) => {
  const [list, setList] = useState([])
  const [currentId, setCurrentId] = useState("")
  const [config, setConfig] = useState({
    "model_name": "", 
    "image_size": 0
  })

  const infoText = {
    "model_name": "Lorem ipsum", 
    "image_size": "Lorem ipsum"
  }

  // Sets the current detector by selecting from list
  const handleSelect = (detector_cfg, detector_id) => {
    setConfig(detector_cfg)
    setCurrentId(detector_id)
  }

  // Send request to add a new detector to backend and update detector list
  const sendAdd = async () => {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/detector`)
    setList([...list, {"id": response.data, "config": {"model_name": "", "image_size": 0}}])
  }

  // Get name of every detector from backend and update detector list
  const getDetectors = async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/detector`)
    setList(response.data)
  }

  // Send which detector to assign to the current setup to backend
  const sendAssigned = async () => {
    await axios.patch(`${import.meta.env.VITE_API_URL}/api/setup/${currentSetupId}`, {detector_id: currentId})
  }

  // Send configuration of selected detector to backend and update the config list
  const sendConfig = (cfg) => {
    axios.patch(`${import.meta.env.VITE_API_URL}/api/detector/${currentId}`, cfg)
    setList(prevList => prevList.map(item =>
      item.id === currentId ? { ...item, config: { ...cfg } } : item
    ))
  }

  // Send delete detector request to backend
  const sendDelete = async (detector) => {
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/detector/${detector["id"]}`)
    setList(list.filter(item => item !== detector))
    setCurrentId("")
  }

  // Helper function to update config
  const updateConfig = (key, value) => {
    setConfig((prev) => ({
      ...prev, 
      [key]: value
    }))
  }

  // Helper function to format config display
  const formatConfigDisplay = (config) => {
    const { model_name, image_size } = config
    if (!model_name && !image_size) return "No configuration set"
    return `${model_name || 'No model'} - Size: ${image_size || 'Not set'}`
  }

  // Send config 1 second after changing one
  useEffect(() => {
    if (!currentId) return

    const timeout = setTimeout(() => {
      sendConfig(config)
    }, 1000)
    return () => clearTimeout(timeout)
  }, [config, currentId])

  // Get detector names on load
  useEffect(() => {
    getDetectors()
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Detector Configuration</h2>
        <p className={styles.subtitle}>Configure and manage detection models for your setup</p>
      </div>

      <div className={styles.mainGrid}>
        {/* Left Panel - Detector List */}
        <div className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Available Detectors</h3>
            <button onClick={sendAdd} className={styles.addButton}>
              <svg viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Detector
            </button>
          </div>

          <div className={styles.detectorList}>
            {list.map((item) => (
              <div
                key={item.id}
                className={`${styles.detectorCard} ${currentId === item.id ? styles.selected : ''}`}
                onClick={() => handleSelect(item.config, item.id)}
              >
                <div className={styles.cardContent}>
                  <div className={styles.cardInfo}>
                    <div className={styles.cardHeader}>
                      <span className={styles.detectorId}>Detector #{item.id}</span>
                      {currentId === item.id && (
                        <span className={styles.selectedBadge}>Selected</span>
                      )}
                    </div>
                    <p className={styles.configDisplay}>
                      {formatConfigDisplay(item.config)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      sendDelete(item)
                    }}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {list.length === 0 && (
            <div className={styles.emptyState}>
              <svg viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className={styles.emptyTitle}>No detectors available</p>
              <p className={styles.emptySubtitle}>Click "Add Detector" to create your first one</p>
            </div>
          )}
        </div>

        {/* Right Panel - Configuration */}
        <div className={styles.rightPanel}>
          <h3 className={styles.panelTitle}>Configuration</h3>
          
          {currentId !== "" ? (
            <div className={styles.configPanel}>
              <h4 className={styles.configTitle}>
                Configuring Detector #{currentId}
              </h4>
              
              <div className={styles.configForm}>
                {Object.entries(config).map(([key, value]) => (
                  <div key={key} className={styles.fieldGroup}>
                    <Tooltip content={infoText[key]}>
                    <label className={styles.fieldLabel}>
                      {key.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </label>
                    </Tooltip>
                    
                    {typeof value === "boolean" ? (
                      <div className={styles.toggleContainer}>
                        
                        <label className={styles.toggle}>
                          
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => updateConfig(key, e.target.checked)}
                            className={styles.toggleInput}
                          />
                          <span className={styles.toggleSlider}></span>
                        </label>
                       
                        <span className={styles.toggleStatus}>
                          {value ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ) : (
                      <input
                        type={key === "image_size" ? "number" : "text"}
                        value={value}
                        onChange={(e) => updateConfig(key, key === "image_size" ? parseInt(e.target.value) || 0 : e.target.value)}
                        className={styles.textInput}
                        placeholder={key === "image_size" ? "Enter image size" : `Enter ${key.split('_').join(' ')}`}
                        min={key === "image_size" ? "0" : undefined}
                      />
                    )}
                    
                  
                  </div>
                ))}
              </div>

              <div className={styles.assignSection}>
                <button onClick={sendAssigned} className={styles.assignButton}>
                  Assign to Current Setup
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.noSelection}>
              <svg viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h4 className={styles.noSelectionTitle}>No Detector Selected</h4>
              <p className={styles.noSelectionText}>
                Select a detector from the list to configure its settings
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetectorComponent