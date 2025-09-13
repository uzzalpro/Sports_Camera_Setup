import axios from "axios"
import { useEffect, useState } from "react"
import styles from "../../styles/ConfigurableComponent.module.css"
import Tooltip from "../Tooltip"

const FieldComponent = ({ currentSetupId }) => {
  const [list, setList] = useState([])
  const [currentId, setCurrentId] = useState("")
  const [config, setConfig] = useState({
    "pitch_width": 0, 
    "pitch_height": 0,
    "left_top_x": 0,
    "left_top_y": 0,
    "right_bottom_x": 0,
    "right_bottom_y": 0,
    "path": ""
  })


  const infoText = {
    "pitch_width": "Lorem ipsum", 
    "pitch_height": "Lorem ipsum",
    "left_top_x": "Lorem ipsum",
    "left_top_y": "Lorem ipsum",
    "right_bottom_x": "Lorem ipsum",
    "right_bottom_y": "Lorem ipsum",
    "path": "Lorem ipsum"
  }

  // Sets the current field by selecting from the list
  const handleSelect = (field_cfg, field_id) => {
    setConfig(field_cfg)
    setCurrentId(field_id)
  }

  // Send request to add a new field to backend and update field list
  const sendAdd = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/field`)
      setList([...list, {
        "id": response.data, 
        "config": {
          "pitch_width": 0, 
          "pitch_height": 0, 
          "left_top_x": 0, 
          "left_top_y": 0, 
          "right_bottom_x": 0, 
          "right_bottom_y": 0, 
          "path": ""
        }
      }])
    } catch (error) {
      console.error("Error adding field:", error)
      alert("Failed to add field. Please try again.")
    }
  }

  // Get name of every field from backend and update field list
  const getFields = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/field`)
      setList(response.data)
    } catch (error) {
      console.error("Error fetching fields:", error)
      alert("Failed to fetch fields. Please try again.")
    }
  }
  
  // Send which field to assign to the current setup to backend
  const sendAssigned = async () => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/setup/${currentSetupId}`, {field_id: currentId})
    } catch (error) {
      console.error("Error assigning field:", error)
      alert("Failed to assign field. Please try again.")
    }
  }

  // Send configuration of selected field to backend
  const sendConfig = (cfg) => {
    try {
      axios.patch(`${import.meta.env.VITE_API_URL}/api/field/${currentId}`, cfg)
      setList(prevList => prevList.map(item =>
        item.id === currentId ? { ...item, config: { ...cfg } } : item
      ))
    } catch (error) {
      console.error("Error sending config:", error)
      alert("Failed to send configuration. Please try again.")
    }
  }

  // Send delete field request to backend
  const sendDelete = async (field) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/field/${field["id"]}`)
      setList(list.filter(item => item !== field))
      setCurrentId("")
    } catch (error) {
      console.error("Error deleting field:", error)
      alert("Failed to delete field. Please try again.")
    }
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
    const { pitch_width, pitch_height, path } = config
    if (!pitch_width && !pitch_height && !path) return "No configuration set"
    return `${pitch_width || 0}x${pitch_height || 0} - ${path || 'No path'}`
  }

  // Send config 1 second after changing one
  useEffect(() => {
    if (!currentId) return

    const timeout = setTimeout(() => {
      sendConfig(config)
    }, 1000)
    return () => clearTimeout(timeout)
  }, [config, currentId])

  // Get field names on load
  useEffect(() => {
    getFields()
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Field Configuration</h2>
        <p className={styles.subtitle}>Configure and manage field settings for your setup</p>
      </div>

      <div className={styles.mainGrid}>
        {/* Left Panel - Field List */}
        <div className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Available Fields</h3>
            <button onClick={sendAdd} className={styles.addButton}>
              <svg viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Field
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
                      <span className={styles.detectorId}>Field #{item.id}</span>
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              <p className={styles.emptyTitle}>No fields available</p>
              <p className={styles.emptySubtitle}>Click "Add Field" to create your first one</p>
            </div>
          )}
        </div>

        {/* Right Panel - Configuration */}
        <div className={styles.rightPanel}>
          <h3 className={styles.panelTitle}>Configuration</h3>
          
          {currentId !== "" ? (
            <div className={styles.configPanel}>
              <h4 className={styles.configTitle}>
                Configuring Field #{currentId}
              </h4>
              
              <div className={styles.configForm}>
                {Object.entries(config).map(([key, value]) => (
                  <div key={key} className={styles.fieldGroup}>
                    <Tooltip  content={infoText[key]}>
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
                        type={typeof value === "number" ? "number" : "text"}
                        value={value}
                        onChange={(e) => updateConfig(key, typeof value === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h4 className={styles.noSelectionTitle}>No Field Selected</h4>
              <p className={styles.noSelectionText}>
                Select a field from the list to configure its settings
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FieldComponent