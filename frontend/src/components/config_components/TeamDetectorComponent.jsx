import axios from "axios"
import { useEffect, useState } from "react"
import styles from "../../styles/ConfigurableComponent.module.css"
import Tooltip from "../Tooltip"

const TeamDetectorComponent = ({ currentSetupId }) => {
  const [list, setList] = useState([])
  const [currentId, setCurrentId] = useState("")
  const [config, setConfig] = useState({
    "type": "", 
    "model_name": "",
    "use_hsl": false,
    "old_dual_head": false
  })


  const infoText = {
    "type": "Lorem ipsum",
    "model_name": "Lorem ipsum",
    "use_hsl": "Lorem ipsum",
    "old_dual_head": "Lorem ipsum"
  }

  // Sets the current team detector by selecting form dropdown menu
  const handleSelect = (td_cfg, td_id) => {
    setConfig(td_cfg)
    setCurrentId(td_id)
  }

  // Send request to add a new team detector to backend and update team detector list
  const sendAdd = async () => {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/team-detector`)
    setList([...list, {"id": response.data, "config": {"type": "", "model_name": "", "use_hsl": false, "old_dual_head": false}}])
  }

  // Get name of every team detector from backend and update team detector list
  const getDetectors = async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/team-detector`)
    setList(response.data)
  }
  
  // Send which team detector to assign to the current setup to backend
  const sendAssigned = async () => {
    await axios.patch(`${import.meta.env.VITE_API_URL}/api/setup/${currentSetupId}`, {team_detector_id: currentId})
  }

  // Send configuration of selected team detector to backend
  const sendConfig = (cfg) => {
    axios.patch(`${import.meta.env.VITE_API_URL}/api/team-detector/${currentId}`, cfg)
    setList(prevList => prevList.map(item =>
      item.id === currentId ? { ...item, config: { ...cfg } } : item
    ))
  }

  // Send delete team detector request to backend
  const sendDelete = async (team_detector) => {
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/team-detector/${team_detector["id"]}`)
    setList(list.filter(item => item !== team_detector))
    setCurrentId("")
  }

  // Helper function to update config - this was missing in the generated code
  const updateConfig = (key, value) => {
    setConfig((prev) => ({
      ...prev, 
      [key]: value
    }))
  }

  // Helper function to format config display
  const formatConfigDisplay = (config) => {
    const { type, model_name } = config
    if (!type && !model_name) return "No configuration set"
    return `${type || 'No type'} - ${model_name || 'No model'}`
  }

  // Send config 1 second after changing one
  useEffect(() => {
    if (!currentId) return

    const timeout = setTimeout(() => {
      sendConfig(config)
    }, 1000)
    return () => clearTimeout(timeout)
  }, [config, currentId]) // Added currentId to dependencies

  // Get team detector names on load
  useEffect(() => {
    getDetectors()
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Team Detector Configuration</h2>
        <p className={styles.subtitle}>Configure and manage team detection models for your setup</p>
      </div>

      <div className={styles.mainGrid}>
        {/* Left Panel - Team Detector List */}
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
              <p className={styles.emptyTitle}>No team detectors available</p>
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
                        type="text"
                        value={value}
                        onChange={(e) => updateConfig(key, e.target.value)}
                        className={styles.textInput}
                        placeholder={`Enter ${key.split('_').join(' ')}`}
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
                Select a team detector from the list to configure its settings
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamDetectorComponent