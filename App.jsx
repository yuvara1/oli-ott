import React from 'react'
import Home from './Home/Home.jsx'
import Watch from './Watch/Watch.jsx'
import Upload from './Upload/Upload.jsx'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/upload" element={<Upload />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>

  )
}

export default App
