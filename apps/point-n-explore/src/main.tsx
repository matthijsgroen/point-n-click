import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './engine/web/App.tsx'
import game from "./game";


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App game={game} />
  </StrictMode>,
)
