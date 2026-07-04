import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RoomConnectionProvider } from "./game/RoomConnectionContext";
import { LandingPage } from "./pages/LandingPage";
import { PlayPage } from "./pages/PlayPage";
import { RoomLobbyPage } from "./pages/RoomLobbyPage";

export default function App() {
  return (
    <BrowserRouter>
      <RoomConnectionProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/room/:roomCode" element={<RoomLobbyPage />} />
          <Route path="/room/:roomCode/play" element={<PlayPage />} />
        </Routes>
      </RoomConnectionProvider>
    </BrowserRouter>
  );
}
