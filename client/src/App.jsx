// Purpose: Top-level React application component.
import AppRoutes from './routes/AppRoutes.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}


export default App
