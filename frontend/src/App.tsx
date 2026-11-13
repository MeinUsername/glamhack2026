import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminUsers from './pages/AdminUsers'
import AdminImport from './pages/AdminImport'
import AdminMasterPrompt from './pages/AdminMasterPrompt'
import IdeaForm, { IdeaEdit } from './ideas/IdeaForm'
import IdeaPage from './ideas/IdeaPage'
import Basket from './pages/Basket'
import IdeasList from './ideas/IdeasList'

// The page routes. The Go function returns the same index.html for all of them.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/import" element={<AdminImport />} />
        <Route path="/admin/master-prompt" element={<AdminMasterPrompt />} />
        <Route path="/ideas/new" element={<IdeaForm />} />
        <Route path="/ideas/:id" element={<IdeaPage />} />
        <Route path="/ideas/:id/edit" element={<IdeaEdit />} />
        <Route path="/basket" element={<Basket />} />
        <Route path="/ideas" element={<IdeasList />} />
      </Route>
    </Routes>
  )
}
