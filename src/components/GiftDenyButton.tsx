import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText } from "@mui/material";
import axios from "axios";
import { useState } from "react";

export default function GiftDenyButton(props: {
    familyId: string,
    memberId: string,
    giftUuid: string,
    onUpdated: () => void
}) {

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false);

    function denyGift() {
        setLoading(true);
        axios.post("/family/" + props.familyId + "/member/" + props.memberId + "/gift/" + props.giftUuid + "/deny")
            .finally(() => {
                setLoading(false);
                props.onUpdated();
            })
    }


    return (
        <>
            <Button 
                sx={{width: '100%'}}
                variant="contained" 
                color="warning"
                onClick={() => setOpen(true)}
                disabled={loading}
                startIcon={loading ? <CircularProgress/> : null}
            >
                Ne plus prendre ce cadeau
            </Button>
            <Dialog open={open}>
                <DialogContent>
                    <DialogContentText>
                        Êtes-vous sûr de vous retirer de ce cadeau ?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} color="inherit">
                        Annuler
                    </Button>
                    <Button onClick={() => {
                        denyGift();
                        setOpen(false);
                    }} color="primary" autoFocus>
                        Oui
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}