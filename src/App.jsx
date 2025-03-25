import { useState } from 'react'
import './App.css'
import Text from './components/Text'



function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <Text/>
      <h1>Hello World</h1>
    </div>
  )
}

export default App
