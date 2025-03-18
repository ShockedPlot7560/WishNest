import {Card, CardContent, CircularProgress} from "@mui/material";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import DeleteFamilyInvitation from "./DeleteFamilyInvitation.tsx";

export default function FamilyInvitations(props: {invitations: null|{uuid: string, email: string}[], onRemove: (uuid: string) => void}) {
    const invitations = props.invitations;

    return (<Card>
        <CardContent>
            <Typography gutterBottom sx={{ color: 'text.secondary' }}>
                Invitations
            </Typography>
            {invitations === null && <Stack sx={{mt: '1rem'}}>
                <CircularProgress size="2rem"/>
            </Stack>}
            {invitations !== null && <List>
                {invitations.map((invitation, index) => (
                    <ListItem
                        key={index}
                        secondaryAction={<DeleteFamilyInvitation onDelete={() => {
                            props.onRemove(invitation.uuid)
                        }} uuid={invitation.uuid}/>}
                    >
                        <ListItemText
                            primary={invitation.email}
                        />
                    </ListItem>
                ))}
                {invitations.length === 0 && <ListItem>
                    <ListItemText
                        primary="Aucune invitations"
                    />
                </ListItem>}
            </List>}
        </CardContent>
    </Card>);
}