import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import axios from "axios";
import {useAuth} from "../provider/AuthProvider.tsx";
import {Family} from "../../api/interfaces";

interface FamilyCreatePopupProps {
    open: boolean;
    handleClose: () => void;
    handleAdd: (family: Family) => void;
}

export default function FamilyCreatePopup({ open, handleClose, handleAdd }: FamilyCreatePopupProps) {
    const [familyName, setFamilyName] = React.useState('');
    const [userName, setUserName] = React.useState('');
    const {user} = useAuth();

    function onSubmit(event: React.FormEvent<HTMLFormElement>){
        event.preventDefault();
        const data = {
            familyName: familyName,
            userName: userName
        };

        axios.post(import.meta.env.VITE_API_BASE_URL + "/users/"+user?.uuid + "/families", data)
            .then(response => {
                if(response.data.error){

                }else{
                    handleAdd(response.data);
                }
            }).then(handleClose);
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
            <DialogTitle>Créer une famille</DialogTitle>
            <DialogContent
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
            >
                <DialogContentText>
                    Une famille est un regroupement de personnes pour s'offrir des cadeaux.
                </DialogContentText>
                <OutlinedInput
                    autoFocus
                    required
                    margin="dense"
                    id="familyName"
                    name="familyName"
                    placeholder="Nom de la famille"
                    type="text"
                    fullWidth
                    onChange={(event) => setFamilyName(event.target.value)}
                />
                <OutlinedInput
                    autoFocus
                    required
                    id="userName"
                    name="userName"
                    placeholder="Comment doit-on vous appeler ? Votre pseudonyme"
                    type="text"
                    fullWidth
                    onChange={(event) => setUserName(event.target.value)}
                />
            </DialogContent>
            <DialogActions sx={{ pb: 3, px: 3 }}>
                <Button onClick={handleClose}>Annuler</Button>
                <Button variant="contained" type="submit">
                    Continuer
                </Button>
            </DialogActions>
        </Dialog>
    );
}