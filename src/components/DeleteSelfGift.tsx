import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import axios from "axios";
import { useState } from "react";
import { useAuth } from "../provider/AuthProvider";

export default function DeleteSelfGift(props: {
    familyId: string,
    giftUuid: string,
    onDelete: () => void
}) {

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false);
    const {user} = useAuth();

    function del() {
        setLoading(true);
        axios.delete(import.meta.env.VITE_API_BASE_URL + "/family/" + props.familyId + "/member/" + user?.uuid + "/gift/" + props.giftUuid)
            .finally(() => {
                setLoading(false);
                props.onDelete();
            })
    }


    return (
        <>
            <Button 
                variant="contained" 
                color="error"
                onClick={() => setOpen(true)}
                disabled={loading}
                startIcon={loading ? <CircularProgress/> : null}
            >
                Supprimer
            </Button>
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>
                    Supprimer le cadeau
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{mb: 1}}>
                        <strong>Attention ! Cette action est irréversible.</strong>
                    </DialogContentText>
                    <DialogContentText sx={{mb: 1}}>
                            Vous ne pourrez pas récupérer ce cadeau après l'avoir supprimé et toute les données privées associées ne seront pas récupérables.
                    </DialogContentText>
                    <DialogContentText>
                            Êtes-vous sûr de vouloir supprimer ce cadeau ?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} color="inherit">
                        Annuler
                    </Button>
                    <Button onClick={() => {
                        del();
                        setOpen(false);
                    }} color="error" autoFocus variant="contained">
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}