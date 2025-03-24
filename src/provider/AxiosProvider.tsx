import axios, { Axios } from "axios";
import { Context, createContext } from "react";

const AxiosContext: Context<Axios> = createContext<Axios>(null as unknown as Axios);

const AxiosProvider = () => {
    axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

    return (<AxiosContext.Provider value={null as unknown as Axios}></AxiosContext.Provider>);
}

export default AxiosProvider;