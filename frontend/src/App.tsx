import { EventFeed } from './components/EventFeed'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🏠 FlexLease</h1>
        <p>Decentralized Equipment Rental Marketplace</p>
      </header>
      
      <main className="app-main">
        <EventFeed />
      </main>

      <footer className="app-footer">
        <p>Real-time events powered by Hiro Chainhooks</p>
      </footer>
    </div>
  )
}

export default App
