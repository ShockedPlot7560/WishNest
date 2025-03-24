import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import {LogoutOutlined} from "@mui/icons-material";
import {useAuth} from "../provider/AuthProvider.tsx";
import {useNavigate} from "react-router-dom";
import FamilySideContent from "./FamilySideContent.tsx";
import FamilyInvitationsSideContent from "./FamilyInvitationsSideContent.tsx";
import { useEffect, useState } from 'react';
import { Family } from '../../api/interfaces/index.ts';
import axios from 'axios';

export default function MenuContent({onClick}: {onClick: () => void}) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [families, setFamilies] = useState<Family[]|null>(null);
    const { user } = useAuth();

    function fetchFamilies() {
        setFamilies(null);
        axios.get(import.meta.env.VITE_API_BASE_URL + "/users/" + user?.uuid + "/families")
            .then(response => {
                setFamilies(response.data);
            }).catch(error => {
                setFamilies([]);
            });
    }

    useEffect(() => {
        fetchFamilies();
    }, [user?.uuid]);

    const secondaryListItems = [
        { text: 'Se déconnecter', icon: <LogoutOutlined />, action: () => {
            logout();
            navigate("/login", { replace: true });
        } },
    ];

    return (
        <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
            <Stack>
                <FamilySideContent onClick={onClick} families={families} updateFamilies={fetchFamilies}/>
                <FamilyInvitationsSideContent refreshFamilies={fetchFamilies}/>
            </Stack>
            <List dense>
                {secondaryListItems.map((item, index) => (
                    <ListItem key={index} disablePadding sx={{ display: 'block' }} onClick={() => {
                        item?.action();
                    }}>
                        <ListItemButton>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Stack>
    );
}