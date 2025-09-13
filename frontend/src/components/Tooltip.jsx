import React, { useState } from "react";
import styles from "../styles/Tooltip.module.css";

const Tooltip = ({ children, content, position = "top" }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={styles.tooltipContainer}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <div
        className={`${styles.tooltipBox} ${styles[position]} ${
          visible ? styles.tooltipVisible : ""
        }`}
      >
        {content}
      </div>
    </div>
  );
};

export default Tooltip;
