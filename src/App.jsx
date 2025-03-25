import { useState } from 'react'
import './App.css'
import Text from './components/Text'



function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <Text/>
    </div>
  )
}

export default App
