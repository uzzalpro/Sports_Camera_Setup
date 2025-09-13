import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import CameraComponent from "./components/CameraComponent";
import ConfigComponent from "./components/ConfigComponent";
import HomeComponent from "./components/HomeComponent";
import OverviewComponent from "./components/OverviewComponent";
import SidebarComponent from "./components/SidebarComponent";
import { useContext } from "react";
import { AppContext } from "./context/AppContext";
import TeamDetectorComponent from "./components/config_components/TeamDetectorComponent";
import FieldComponent from "./components/config_components/FieldComponent";
import DetectorComponent from "./components/config_components/DetectorComponent";

// Guard component
const RequireSetup = () => {
  const { currentSetupId } = useContext(AppContext);
  return currentSetupId ? <Outlet /> : <Navigate to="/" replace />;
};


function App() {


  return (
    <div className="app">
      <SidebarComponent />

      <div className="pageComponents">
        <Routes>
          {/* Public route */}
          <Route path="/" element={<HomeComponent />} />

          {/* Protected routes */}
          <Route element={<RequireSetup />}>
            <Route path="/camera" element={<CameraComponent />} />
            <Route path="/overview" element={<OverviewComponent />} />
            <Route path="/config" element={<ConfigComponent />} />
            <Route path="/team" element={<TeamDetectorComponent />} />
            <Route path="/detect" element={<DetectorComponent />} />
            <Route path="/field" element={<FieldComponent />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      
    </div>
  );
}

export default App;
