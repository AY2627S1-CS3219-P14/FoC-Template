import { Route, Routes } from 'react-router'
import { AppLayout } from './components/layout/AppLayout'
import { PublicOnlyRoute, RequireAuth } from './features/auth/AuthRoutes'
import { CreateErrandPage } from './pages/CreateErrandPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { MyErrandsPage } from './pages/MyErrandsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'
import { SuppliersPage } from './pages/SuppliersPage'

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="my-errands" element={<MyErrandsPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="errands/new" element={<CreateErrandPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
