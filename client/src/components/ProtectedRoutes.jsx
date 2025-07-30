import { useSelector, useDispatch } from "react-redux"
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useLoadUserQuery } from "@/features/api/authApi";

export const ProtectedRoute = ({children}) => {
    const {isAuthenticated} = useSelector(store=>store.auth);
    const dispatch = useDispatch();
    const { refetch } = useLoadUserQuery();

    useEffect(() => {
        // Check for token cookie on initial load
        const token = document.cookie.split('; ').find(row => row.startsWith('token='));
        if (token && !isAuthenticated) {
            refetch(); // This will dispatch userLoggedIn if token is valid
        }
    }, [isAuthenticated, refetch]);

    if(!isAuthenticated){
        return <Navigate to="/login"/>
    }

    return children;
}
export const AuthenticatedUser = ({children}) => {
    const {isAuthenticated} = useSelector(store=>store.auth);

    if(isAuthenticated){
        return <Navigate to="/"/>
    }

    return children;
}

export const AdminRoute = ({children}) => {
    const {user, isAuthenticated} = useSelector(store=>store.auth);

    if(!isAuthenticated){
        return <Navigate to="/login"/>
    }

    if(user?.role !== "instructor"){
        return <Navigate to="/"/>
    }

    return children;
}