import './App.css'
import { TodoList } from './components/TodoList'
import { ThemeToggle } from './components/ThemeToggle'

function App() {
  return (
    <div className="app">
      <ThemeToggle />
      <TodoList />
    </div>
  )
}

export default App
