import Button from "@mui/material/Button";
import {Add} from "@mui/icons-material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import * as React from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import {useState} from "react";
import axios from "axios";
import Typography from "@mui/material/Typography";

export default function InviteFamilyButton(props: {familyId: string, onInvite: () => void}) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string|null>('');
    const [loading, setLoading] = useState(false);

    const handleClose = () => {
        setOpen(false);
    }

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        await axios.post("/families/"+props.familyId+"/invitations", {
            email: email
        }).then((response) => {
            if(response.data.success){
                handleClose();
                props.onInvite();
                setEmail('');
            }else{
                setError(response.data.error);
            }
        }).finally(() => {
            setLoading(false);
        });
    }

    return (
        <>
            <Button
                variant={"contained"}
                color={"primary"}
                startIcon={<Add/>}
                onClick={() => setOpen(true)}
            >
                Inviter
            </Button>
            <Dialog open={open}
                    onClose={handleClose}
                    slotProps={{
                        paper: {
                            component: 'form',
                            onSubmit: onSubmit,
                            sx: { backgroundImage: 'none' },
                        },
                    }}>
                <DialogTitle>Inviter un membre à la famille</DialogTitle>
                <DialogContent
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
                >
                    <DialogContentText>
                        Veuillez entrer l'adresse email du membre que vous souhaitez inviter.
                    </DialogContentText>
                    {error && <Typography color="error">{error}</Typography>}
                    <OutlinedInput
                        autoFocus
                        required
                        margin="dense"
                        id="email"
                        name="email"
                        placeholder="Email"
                        type="email"
                        value={email}
                        fullWidth
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ pb: 3, px: 3 }}>
                    <Button onClick={handleClose}>Annuler</Button>
                    <Button variant="contained" type="submit" disabled={loading}>
                        Continuer
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}