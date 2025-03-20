import Layout from "../components/Layout.tsx";
import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import axios from "axios";
import Stack from "@mui/material/Stack";
import {Card, CardContent, Chip, CircularProgress, Grid, ListItemAvatar} from "@mui/material";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import {ImportContactsSharp} from "@mui/icons-material";
import {styled} from "@mui/material/styles";
import {useAuth} from "../provider/AuthProvider.tsx";
import ApproveGroupPopup from "../components/ApproveGroupPopup.tsx";
import MemberContent from "../components/MemberContent.tsx";
import InviteFamilyButton from "../components/InviteFamilyButton.tsx";
import FamilyInvitations from "../components/FamilyInvitations.tsx";

interface FamilyResponseType {
    uuid: string;
    name: string;
    members: {uuid: string, name: string, email: string}[];
}

export default function FamilyIndex() {
    const { familyId } = useParams();
    const [ family, setFamily ] = useState<FamilyResponseType|null>(null);
    const [ choosenMemberId, setChoosenMemberId ] = useState<string|null>(null);
    const [ choosenMember, setChoosenMember ] = useState<{uuid: string, name: string, email: string}|null>(null);
    const [ invitations, setInvitations ] = useState<{uuid: string, email: string}[]|null>(null);
    const { user } = useAuth();

    useEffect(() => {
        axios.get(import.meta.env.VITE_API_BASE_URL + "/family/" + familyId)
            .then(response => {
                setFamily(response.data);
                const currentUser = response.data.members.find((m: {uuid: string}) => m.uuid === user?.uuid);
                if(currentUser) {
                    setChoosenMember(currentUser);
                    setChoosenMemberId(currentUser.uuid);
                    // sort array
                    const members = response.data.members;
                    members.splice(members.findIndex((m: {uuid: string}) => m.uuid === currentUser.uuid), 1);
                    members.unshift(currentUser);
                    setFamily({...response.data, members});
                }
            });
    }, [familyId, user?.uuid]);

    async function updateInvitations(familyId: string) {
        await axios.get(import.meta.env.VITE_API_BASE_URL + "/families/"+familyId+"/invitations")
            .then((response) => {
                setInvitations(response.data);
            });
    }


    useEffect(() => {
        updateInvitations(familyId ?? "");
    }, [familyId]);

    const chooseMember = (uuid: string) => {
        setChoosenMember(family?.members.find(m => m.uuid === uuid) ?? null);
        setChoosenMemberId(uuid);
    }

    const FamilyListItem = styled(ListItem)(({ theme }) => ({
        "&:hover": {
            backgroundColor: theme.palette.action.hover,
            cursor: "pointer"
        },
        borderRadius: theme.shape.borderRadius
    }));

    return (
        <Layout>
            {family === null && <Stack sx={{mt: '2rem'}}>
                <CircularProgress size="4rem"/>
            </Stack>}
            {family !== null && <Stack>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{
                        alignItems: { xs: "flex-start", sm: "center" },
                        margin: '2rem'
                    }}>
                    <h1>Famille {family?.name}</h1>
                    <InviteFamilyButton familyId={familyId ?? ""} onInvite={() => {
                        setInvitations(null);
                        updateInvitations(familyId ?? "");
                    }}></InviteFamilyButton>
                </Stack>

                <Grid container spacing={2}>
                {familyId && <ApproveGroupPopup familyId={familyId}/>}
                    <Grid item xs={12} md={3}>
                        <Stack spacing={2}>
                            <Card>
                                <CardContent>
                                    <Typography gutterBottom sx={{ color: 'text.secondary' }}>
                                        Membres de la famille
                                    </Typography>
                                    <List>
                                        {(family?.members ?? []).map((member, index) => (
                                            <FamilyListItem onClick={() => chooseMember(member.uuid)} sx={{
                                                backgroundColor: member.uuid === choosenMemberId ? 'hsla(220, 20%, 35%, 0.3)' : 'inherit'
                                            }} key={index}>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        <ImportContactsSharp />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={member.name}
                                                />
                                                {member.uuid === user?.uuid && <Chip label="Vous" color="success" variant="outlined" />}
                                            </FamilyListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                            <FamilyInvitations invitations={invitations} onRemove={(uuid: string) => {
                                setInvitations(invitations?.filter(i => i.uuid !== uuid) ?? null);
                            }}/>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} md={9}>
                        <MemberContent member={choosenMember} familyId={familyId ?? ""}/>
                    </Grid>
                </Grid>
            </Stack>}
        </Layout>
    )
}