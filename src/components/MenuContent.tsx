import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import {LogoutOutlined} from "@mui/icons-material";
import {useAuth} from "../provider/AuthProvider.tsx";
import {useNavigate} from "react-router-dom";
import FamilySideContent from "./FamilySideContent.tsx";
import FamilyInvitationsSideContent from "./FamilyInvitationsSideContent.tsx";

export default function MenuContent() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const mainListItems = [
        { text: 'Accueil', icon: <HomeRoundedIcon /> },
    ];

    const secondaryListItems = [
        { text: 'Se déconnecter', icon: <LogoutOutlined />, action: () => {
            logout();
            navigate("/login", { replace: true });
        } },
    ];

    return (
        <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
            <Stack>
                <List dense>
                    {mainListItems.map((item, index) => (
                        <ListItem key={index} disablePadding sx={{ display: 'block' }}>
                            <ListItemButton selected={index === 0}>
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <FamilySideContent/>
                <FamilyInvitationsSideContent/>
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