import {useEffect, useState} from "react";
import axios from "axios";
import {Card, CardContent, Grid, ListItemAvatar} from "@mui/material";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Avatar from "@mui/material/Avatar";
import {ImportContactsSharp} from "@mui/icons-material";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import ApproveGroupRequestButton from "./ApproveGroupRequestButton.tsx";
import {useAuth} from "../provider/AuthProvider.tsx";

export default function ApproveGroupPopup(props: {familyId: string}) {
    const [ requestsToApprove, setRequestsToApprove ] = useState<{groupUuid: string, originName: string, targetName: string, targetUuid: string}[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        axios.get(import.meta.env.VITE_API_BASE_URL + "/users/" + user?.uuid + "/family/" + props.familyId + "/requests")
            .then(response => {
                setRequestsToApprove(response.data);
            });
    }, [props.familyId, user?.uuid]);

    return (
        <>
        {requestsToApprove.length !== 0 && <Grid item xs={12}>
            <Card className="MuiCard-error">
                <CardContent>
                    <Typography gutterBottom>
                        Vous avez des demandes d'adhésion à approuver
                    </Typography>
                    <Typography  sx={{ color: 'text.secondary' }}>
                        Cette demandes surviennent lorsqu'un membre rejoint une famille. Il a besoin de l'approbation d'un membre de chaque groupe de la famille pour avoir accès aux données chiffrées.
                    </Typography>
                    <List>
                        {requestsToApprove.map((request, index) => {
                            return (<ListItem key={index}>
                                    <ListItemAvatar>
                                        <Avatar>
                                            <ImportContactsSharp />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        sx={{
                                            flexGrow: 0
                                        }}
                                        primary={request.originName}
                                        secondary={"Souhaite rejoindre le groupe dédié à : " + request.targetName}
                                    />
                                    <Box sx={{marginLeft: '1rem'}}></Box>
                                    <ApproveGroupRequestButton groupUuid={request.groupUuid} targetUuid={request.targetUuid} onSuccess={() => {
                                        setRequestsToApprove(requestsToApprove.filter(r => r.groupUuid !== request.groupUuid));
                                    }}/>
                                </ListItem>
                            )})}
                    </List>
                </CardContent>
            </Card>
        </Grid>}
        </>
    );
}