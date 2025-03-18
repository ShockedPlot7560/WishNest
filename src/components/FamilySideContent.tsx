import * as React from "react";
import {Family} from "../../api/interfaces";
import {useEffect} from "react";
import axios from "axios";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import {Badge, CircularProgress} from "@mui/material";
import FamilyCreatePopup from "./FamilyCreatePopup.tsx";
import FamilyUnlinkConfirm from "./FamilyUnlinkConfirm.tsx";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import {useAuth} from "../provider/AuthProvider.tsx";
import {useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";

export default function FamilySideContent() {
    const [families, setFamilies] = React.useState<Family[]|null>(null);
    const [openFamilyCreate, setOpenFamilyCreate] = React.useState<boolean>(false);
    const [openFamilyUnlink, setOpenFamilyUnlink] = React.useState<boolean>(false);
    const [familyUnlink] = React.useState<Family | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(import.meta.env.VITE_API_BASE_URL + "/users/" + user?.uuid + "/families")
            .then(response => {
                setFamilies(response.data);
            });
    }, []);

    async function removeFromFamily(family: Family) {
        await axios.delete(import.meta.env.VITE_API_BASE_URL + "/users/" + user?.uuid + "/families/" + family.uuid)
            .then(() => {
                setFamilies((families ?? []).filter(f => f.uuid !== family.uuid));
            });
    }

    return (
        <>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} >
                Mes familles
            </Typography>
            {families === null && <Stack sx={{alignItems: "center", mt: 2}}>
                <CircularProgress size="2rem"/>
            </Stack>}
            <FamilyCreatePopup open={openFamilyCreate} handleClose={() => {
                setOpenFamilyCreate(false);
            }} handleAdd={(family) => {
                setFamilies([...(families ?? []), family]);
            }}/>
            <FamilyUnlinkConfirm open={openFamilyUnlink} family={familyUnlink} handleClose={() => setOpenFamilyUnlink(false)} handleOk={(family) => removeFromFamily(family)}/>
            <List>
                {families && families.map((item: Family) => {

                    return (
                        <Box key={item.uuid}>
                            <Badge badgeContent={'!'} color="error" invisible={!item.needAttention} sx={{
                                width: '100%'
                            }}>
                            <ListItem disablePadding sx={{ display: 'block' }} /*secondaryAction={
                                <IconButton edge="start" onClick={() => {
                                    setFamilyUnlink(item);
                                    setOpenFamilyUnlink(true);
                                }}>
                                    <LinkOff/>
                                </IconButton>
                            }*/ onClick={() => {
                                navigate("/families/" + item.uuid);
                            }}>
                                    <ListItemButton>
                                            <ListItemText primary={item.name} color={item.needAttention ? "error" : "initial"} />
                                    </ListItemButton>
                            </ListItem>
                            </Badge>
                        </Box>
                    )})}
                {families && families.length === 0 && <Stack sx={{ mt: 1}}>
                    <Typography variant="body2" component="div" >
                        Aucune famille
                    </Typography>
                </Stack>}
                <ListItem disablePadding sx={{ display: 'block', mt: 2 }}>
                    <ListItemButton sx={{ textAlign: "center" }} onClick={() => setOpenFamilyCreate(true)}>
                        <ListItemText primary="Créer une famille" />
                    </ListItemButton>
                </ListItem>
            </List>
        </>
    );
}