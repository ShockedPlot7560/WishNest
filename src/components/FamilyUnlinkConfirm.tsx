import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {Family} from "../../api/interfaces";

interface FamilyUnlinkConfirmProps {
    open: boolean;
    family: Family|null;
    handleClose: () => void;
    handleOk: (family: Family) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function FamilyUnlinkConfirm({ open, family, handleClose, handleOk }: FamilyUnlinkConfirmProps) {
    function onSubmit(event: React.FormEvent<HTMLFormElement>){
        event.preventDefault();
        if(family !== null){
            handleOk(family).then(handleClose);
        }
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
            <DialogTitle>Se retirer d'une famille</DialogTitle>
            <DialogContent
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
            >
                <DialogContentText>
                    Êtes vous sûr de vouloir quitter cette famille ? Vous devrez être réinvité pour y revenir.
                </DialogContentText>
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