import React from "react"
import styles from "../styles/OverviewComponent.module.css"

const OverviewComponent = () => {
  return (
    <div>
      <h1>Calibration Overview</h1>

      <img className={styles.img} src="/project_result.png" />
    </div>
  )
}

export default OverviewComponent
