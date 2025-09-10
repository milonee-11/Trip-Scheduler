import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from './components/Homepage'; // Corrected the component import to match
import AuthSection from "./components/AuthSection"; // renamed version of AuthForm
import Dashboard from "./components/Dashboard";
import Contact from "./components/Contact"; 
import AboutMain from "./components/AboutMain";
import Blog from "./components/Blog";
import Budget from "./components/Budget";
function App() {
  return (
    <Router>
      <Routes>
        {/* Home page route */}
        <Route path="/" element={<HomePage />} />
        
        {/* Authentication routes */}
        <Route path="/auth" element={<AuthSection type="login" />} /> 
        <Route path="/auth/signup" element={<AuthSection type="signup" />} />

        {/* Dashboard route */}
        <Route path="/dashboard" element={<Dashboard />} />
         <Route path="/contact" element={<Contact />} />
         <Route path='/about' element={<AboutMain/>}/>
         <Route path='/blog' element={<Blog/>}/>
         <Route path="/budget" element={<Budget />} />
      </Routes>
    </Router>
  );
}

export default App;
