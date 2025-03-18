import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText } from "@mui/material";
import axios from "axios";
import { useState } from "react";

export default function GiftAcceptButton(props: {
    familyId: string,
    memberId: string,
    giftUuid: string,
    onUpdated: () => void
}) {

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false);

    function acceptGift() {
        setLoading(true);
        axios.post(import.meta.env.VITE_API_BASE_URL + "/family/" + props.familyId + "/member/" + props.memberId + "/gift/" + props.giftUuid + "/accept")
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
                onClick={() => setOpen(true)}
                disabled={loading}
                startIcon={loading ? <CircularProgress/> : null}
            >
                Prendre le cadeau
            </Button>
            <Dialog open={open}>
                <DialogContent>
                    <DialogContentText>
                        Êtes-vous sûr de vouloir prendre ce cadeau ?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} color="inherit">
                        Annuler
                    </Button>
                    <Button onClick={() => {
                        acceptGift();
                        setOpen(false);
                    }} color="primary" autoFocus>
                        Oui
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}