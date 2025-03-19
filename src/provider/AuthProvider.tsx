import axios from "axios";
import {Context, createContext, SetStateAction, useContext, useEffect, useMemo, useState} from "react";
import {LoggedUser} from "../../api/lib/users.ts";


// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const AuthContext: Context<{
    token: string | null,
    derivedKey: string | null,
    user: LoggedUser | null,
    setDerivedKey: ((newToken: SetStateAction<string | null>) => void),
    setToken: ((newToken: SetStateAction<string | null>) => void),
    setUser: ((newUser: SetStateAction<LoggedUser | null>) => void),
    logout: (() => void)
}> = createContext({
    token: null,
    derivedKey: null,
    user: null,
    setToken: () => {},
    setDerivedKey: () => {},
    setUser: () => {},
    logout: () => {}
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const AuthProvider = ({children}) => {
    // State to hold the authentication token
    const [token, setToken_] = useState(localStorage.getItem("token"));
    const [derivedKey, setDerivedKey_] = useState(localStorage.getItem("derivedKey"));
    const [user, setUser_] = useState(JSON.parse(localStorage.getItem("user") ?? "null") as LoggedUser|null);

    // Function to set the authentication token
    const setToken = (newToken: SetStateAction<string | null>): void => {
        setToken_(newToken);
    };

    const setDerivedKey = (newDerivedKey: SetStateAction<string | null>): void => {
        setDerivedKey_(newDerivedKey);
    }

    const setUser = (newUser: SetStateAction<LoggedUser | null>): void => {
        setUser_(newUser);
    }

    const logout = () => {
        setToken(null);
        setDerivedKey(null);
        setUser(null);
    };

    useEffect(() => {
        if (token) {
            console.log("Setting token");
            axios.defaults.headers.common["Authorization"] = "Bearer " + token;
            localStorage.setItem('token',token);
        } else {
            console.log("Deleting token");
            delete axios.defaults.headers.common["Authorization"];
            localStorage.removeItem('token')
        }
    }, [token]);

    useEffect(() => {
        if (derivedKey) {
            console.log("Setting derivedKey");
            axios.defaults.headers.common["derivedKey"] = derivedKey;
            localStorage.setItem('derivedKey',derivedKey);
        } else {
            console.log("Deleting derivedKey");
            delete axios.defaults.headers.common["derivedKey"];
            localStorage.removeItem('derivedKey')
        }
    }, [derivedKey]);

    useEffect(() => {
        if (user) {
            console.log("Setting user");
            localStorage.setItem('user',JSON.stringify(user));
        } else {
            console.log("Deleting user");
            localStorage.removeItem('user')
        }
    });

    // Memoized value of the authentication context
    const contextValue = useMemo(
        () => ({
            token,
            derivedKey,
            user,
            setToken,
            setDerivedKey,
            setUser,
            logout
        }),
        [token, derivedKey, user, logout]
    );

    // Provide the authentication context to the children components
    return (
        <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export default AuthProvider;