import { Navigate } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider";
import {ReactElement} from "react";

export const ProtectedRoute = ({element}: {element: ReactElement}) => {
    const { token } = useAuth();

    if (!token) {
        return <Navigate to="/login" />;
    }

    return element;
};