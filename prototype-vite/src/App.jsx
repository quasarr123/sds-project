
import { useState } from "react";
import Login from "./Login.jsx";
import StudentDashboard from "./StudentDashboard.jsx";

function App() {
  const [loggedInRole, setLoggedInRole] = useState("");

  if (loggedInRole === "Student") {
    return <StudentDashboard />;
  }

  return <Login onLogin={setLoggedInRole} />;
} 

export default App;
