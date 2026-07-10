import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Chromata from './projects/chromata.jsx'
import Meridian from './projects/meridian.jsx'
import Forma from './projects/forma-landing.jsx'
import Altus from './projects/altus-mobile-kit.jsx'
import Forge from './projects/forge-code-review.jsx'
import Nexus from './projects/nexus-rag.jsx'
import FINTRACK from './projects/fintrack.jsx'
import Lumena from './projects/lumena-pmu-booking.jsx'
import AuraShadeMatch from './projects/aura-shade-match.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/projects/chromata" element={<Chromata />} />
        <Route path="/projects/meridian" element={<Meridian />} />
        <Route path="/projects/forma" element={<Forma />} />
        <Route path="/projects/altus" element={<Altus />} />
        <Route path="/projects/forge" element={<Forge />} />
        <Route path="/projects/nexus" element={<Nexus />} />
        <Route path="/projects/fintrack" element={<FINTRACK />} />
        <Route path="/projects/lumena" element={<Lumena />} />
        <Route path="/projects/aura" element={<AuraShadeMatch />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)