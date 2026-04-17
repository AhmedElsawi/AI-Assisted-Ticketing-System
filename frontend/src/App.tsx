// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import Login from './pages/Login'
// import RequesterDashboard from './pages/requester/RequesterDashboard'
// import AgentDashboard from './pages/agent/AgentDashboard'
// import AdminDashboard from './pages/admin/AdminDashboard'
// import ProtectedRoute from './components/layout/ProtectedRoute'

// const queryClient = new QueryClient()

// function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <BrowserRouter>
//         <Routes>
//           <Route path="/login" element={<Login />} />
//           <Route path="/requester" element={
//             <ProtectedRoute allowedRoles={['REQUESTER']}>
//               <RequesterDashboard />
//             </ProtectedRoute>
//           }/>
//           <Route path="/agent" element={
//             <ProtectedRoute allowedRoles={['AGENT']}>
//               <AgentDashboard />
//             </ProtectedRoute>
//           }/>
//           <Route path="/admin" element={
//             <ProtectedRoute allowedRoles={['ADMIN']}>
//               <AdminDashboard />
//             </ProtectedRoute>
//           }/>
//           <Route path="*" element={<Navigate to="/login" replace />} />
//         </Routes>
//       </BrowserRouter>
//     </QueryClientProvider>
//   )
// }

// export default App


import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login'
import RequesterDashboard from './pages/requester/RequesterDashboard'
import AgentDashboard from './pages/agent/AgentDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/layout/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    }
  }
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/requester" element={
            <ProtectedRoute allowedRoles={['REQUESTER']}>
              <RequesterDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/agent" element={
            <ProtectedRoute allowedRoles={['AGENT']}>
              <AgentDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}