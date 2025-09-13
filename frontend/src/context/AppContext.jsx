import { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentSetup, setCurrentSetup] = useState(null);
  const [currentSetupId, setCurrentSetupId] = useState(null);
  const [currentCamera, setCurrentCamera] = useState(null);
  const [currentCamId, setCurrentCamId] = useState("");
  const [imageURL, setImageURL] = useState(null);
  const [allCamConfig, setAllCamConfig] = useState({});
  const [innerPoints, setInnerPoints] = useState([]);
  const [outerPoints, setOuterPoints] = useState([]);
  const [undParams, setUndParams] = useState();
  const [hgSrcPts, setHgSrcPts] = useState();
  const [hgDstPts, setHgDstPts] = useState();
  const [config, setConfig] = useState();
  
  // Unified image size state (removed imgSize duplicate)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  // Unified crop state (removed cropData duplicate)
  const [cropData, setCropData] = useState([]);

  const value = {
    currentSetup,
    setCurrentSetup,
    currentSetupId,
    setCurrentSetupId,
    currentCamera,
    setCurrentCamera,
    currentCamId,
    setCurrentCamId,
    imageURL,
    setImageURL,
    allCamConfig,
    setAllCamConfig,
    innerPoints,
    setInnerPoints,
    outerPoints,
    setOuterPoints,
    imageSize,
    setImageSize,
    cropData,
    setCropData,
    undParams,
    setUndParams,
    hgSrcPts,
    setHgSrcPts,
    hgDstPts,
    setHgDstPts,
    config,
    setConfig
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};