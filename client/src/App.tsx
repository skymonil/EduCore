import { BrowserRouter, Routes, Route, Router } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";

function App() {
  return (
    <main>
      {/* <BrowserRouter> */}
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      {/* </BrowserRouter> */}
    </main>
  );
}

export default App;
