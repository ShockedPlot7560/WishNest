import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {Invitation} from "../../api/interfaces";
import axios from "axios";
import {useAuth} from "../provider/AuthProvider.tsx";
import * as React from "react";
import FamilyInvitationAcceptPopup from "./FamilyInvitationAcceptPopup.tsx";

interface FamilyInvitationPopupProps {
    open: boolean;
    invitation: Invitation|null;
    handleClose: () => void;
    handleDelete: (invitation: Invitation) => void;
}

export default function FamilyInvitationPopup({ open, invitation, handleClose, handleDelete }: FamilyInvitationPopupProps) {
    const [openInvitation, setOpenInvitation] = React.useState<boolean>(false);
    const {user} = useAuth();

    function onSubmit(event: React.FormEvent<HTMLFormElement>){
        event.preventDefault();
        setOpenInvitation(true);
    }

    function deny() {
        axios.delete("/users/" + user?.uuid + "/invitations/" + invitation?.uuid)
            .then((response) => {
                console.log(response);
                handleClose();
                if(invitation !== null) handleDelete(invitation);
            })
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            slotProps={{
                paper: {
                    component: 'form',
                    onSubmit: onSubmit,
                    sx: { backgroundImage: 'none' },
                },
            }}
        >
            {invitation && <FamilyInvitationAcceptPopup
                open={openInvitation}
                invitation={invitation}
                handleClose={() => setOpenInvitation(false) }
                handleDelete={(invitation) => {
                    handleDelete(invitation);
                    handleClose();
                }}
                />}
            <DialogTitle>Invitation à rejoindre une famille</DialogTitle>
            <DialogContent
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
            >
                <DialogContentText>
                    Vous avez été invité à rejoindre la famille {invitation?.family.name}. Souhaitez-vous accepter ?
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ pb: 3, px: 3 }}>
                <Button onClick={handleClose}>Annuler</Button>
                <Button onClick={deny} variant="outlined" color="error" >Refuser</Button>
                <Button variant="contained" type="submit">
                    Accepter
                </Button>
            </DialogActions>
        </Dialog>
    );
}