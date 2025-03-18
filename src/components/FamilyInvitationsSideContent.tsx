import * as React from "react";
import {Invitation} from "../../api/interfaces";
import {useEffect} from "react";
import axios from "axios";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import {CircularProgress} from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import {useAuth} from "../provider/AuthProvider.tsx";
import FamilyInvitationPopup from "./FamilyInvitationPopup.tsx";

export default function FamilyInvitationsSideContent() {
    const [invitations, setInvitations] = React.useState<Invitation[]|null>(null);
    const [openFamilyInvitation, setOpenFamilyInvitation] = React.useState<boolean>(false);
    const [selectedInvitation, setSelectedInvitation] = React.useState<Invitation|null>(null);
    const { user } = useAuth();

    useEffect(() => {
        axios.get(import.meta.env.VITE_API_BASE_URL + "/users/" + user?.uuid + "/invitations")
            .then(response => {
                setInvitations(response.data);
            });
    }, []);

    return (
        <>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} >
                Invitations reçues
            </Typography>
            {invitations === null && <Stack sx={{alignItems: "center", mt: 2}}>
                <CircularProgress size="2rem"/>
            </Stack>}
            <FamilyInvitationPopup
                open={openFamilyInvitation}
                invitation={selectedInvitation}
                handleClose={() => setOpenFamilyInvitation(false)}
                handleDelete={(invitation: Invitation) => {
                    setInvitations((invitations ?? [])?.filter((item: Invitation) => item.uuid !== invitation.uuid));
                }}
            />
            <List>
                {invitations && invitations.map((item: Invitation) => {
                    return (
                        <>
                            <ListItem key={item.uuid} disablePadding sx={{ display: 'block' }} onClick={() => {
                                setSelectedInvitation(item);
                                setOpenFamilyInvitation(true);
                            }}>
                                <ListItemButton>
                                    <ListItemText primary={item.family.name} />
                                </ListItemButton>
                            </ListItem>
                        </>
                    )})}
                {invitations && invitations.length === 0 && <ListItem>
                    <ListItemText
                        primary="Aucune invitations reçues"
                    />
                </ListItem>}
            </List>
        </>
    );
}