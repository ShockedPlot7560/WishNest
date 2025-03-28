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
import axios from 'axios';
import AxiosProvider from './provider/AxiosProvider.tsx';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

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

const token = localStorage.getItem("token");
const derivedKey = localStorage.getItem("derivedKey");

if (token) {
    axios.defaults.headers.common["Authorization"] = "Bearer " + token;
}
if (derivedKey) {
    axios.defaults.headers.common["derivedKey"] = derivedKey;
}

async function subscribeUser() {
    if (!('serviceWorker' in navigator)) {
        console.log("Service workers are not supported in this browser.");
        return;
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log("Push notifications are supported!");
    }else{
        console.log("Push notifications are not supported!");
        return;
    }
  
    await navigator.serviceWorker.register('/service-worker.js');
    const fp = await FingerprintJS.load();

    const { visitorId } = await fp.get();

    const serverKey = await axios.get("/push-server-key")
        .then((response) => response.data.key);

    console.log("ServerKey : ", serverKey);

    navigator.serviceWorker.ready
        .then(registration => {
            registration.addEventListener('push', event => {
                console.log("Push event received", event);
            }); 

            return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: serverKey
            });
        })
        .then(subscription => {
            console.log('Abonnement réussi:', JSON.stringify(subscription));

            // Une fois l'utilisateur abonné, on envoie l'abonnement au backend
            return axios.post('http://localhost:3000/api/subscribe-push', {
                subscription: subscription,
                deviceUuid: visitorId
            });
        })
        .catch(err => {
            console.error('Erreur lors de l\'abonnement aux notifications push:', err);
        });
}

subscribeUser();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <AppTheme>
          <CssBaseline enableColorScheme />
          <AxiosProvider/>
          <AuthProvider>
                <RouterProvider router={router}/>
          </AuthProvider>
      </AppTheme>
  </StrictMode>,
)
