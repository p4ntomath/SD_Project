import { useState } from 'react'
import './App.css'
import Text from './components/Text.jsx'
import Button from './components/button.jsx'


function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <Button/>
      <Text/>
      <h1>Hello World</h1>
    </div>
  )
}

export default App
