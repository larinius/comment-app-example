import React from "react";
import styles from "./LoadingBar.module.css";

interface LoadingBarProps {
  className?: string;
}

const LoadingBar: React.FC<LoadingBarProps> = ({ className }) => {
  return (
    <div className={`${styles.container} ${className || ""}`}>
      <div className={styles.bar} />
    </div>
  );
};

export default LoadingBar;
