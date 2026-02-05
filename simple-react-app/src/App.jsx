import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="container">
      <h1>🦂 Graggle's React App</h1>
      <p>Created for <strong>Gold Pool</strong></p>
      
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          Tokens Burned: {count}
        </button>
        <p>
          This is a simple React app deployed via OpenClaw.
        </p>
      </div>
      
      <p className="footer">
        "Sharp, resourceful, and loyal."
      </p>
    </div>
  )
}

export default App
