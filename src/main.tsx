import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
    RouterProvider
} from "react-router-dom";
import {ProtectedRoute} from "./components/ProtectedRoute.tsx";
import AuthProvider from "./provider/AuthProvider.tsx";
import AppTheme from "./theme/AppTheme.tsx";
import CssBaseline from "@mui/material/CssBaseline";
import SignIn from "./pages/SignIn.tsx";
import Index from "./pages/Index.tsx";
import FamilyIndex from "./pages/FamilyIndex.tsx";
import Register from './pages/Register.tsx';

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path={"/"}>
            <Route index element={<ProtectedRoute element={<Index/>}/>}/>
            <Route path={"families/:familyId"} element={<ProtectedRoute element={<FamilyIndex/>}/>}/>
            <Route path={"login"} element={<SignIn/>}/>
            <Route path={"register"} element={<Register/>}/>
        </Route>
    )
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <AppTheme>
          <CssBaseline enableColorScheme />
          <AuthProvider>
                <RouterProvider router={router}/>
          </AuthProvider>
      </AppTheme>
  </StrictMode>,
)
