import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import axios from "axios";
import { useState } from "react";
import { useAuth } from "../provider/AuthProvider";

export default function AddSelfGift(props: {
    familyId: string,
    onAdd: () => void
}) {

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const {user} = useAuth();

    function create() {
        setLoading(true);
        axios.post(import.meta.env.VITE_API_BASE_URL + "/family/" + props.familyId + "/member/" + user?.uuid + "/gift", {
            title: title,
            content: content
        })
            .finally(() => {
                setLoading(false);
                props.onAdd();
            })
    }


    return (
        <>
            <Button 
                variant="contained" 
                onClick={() => setOpen(true)}
                disabled={loading}
                startIcon={loading ? <CircularProgress/> : null}
            >
                Proposer un cadeau
            </Button>
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>
                    Proposer un cadeau
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Ce cadeau sera proposé à tout les membres de la famille.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="title"
                        label="Titre"
                        type="text"
                        fullWidth
                        variant="standard"
                        onChange={(e) => {
                            setTitle(e.target.value);
                        }}
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="content"
                        label="Description"
                        type="text"
                        fullWidth
                        variant="standard"
                        onChange={(e) => {
                            setContent(e.target.value);
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} color="inherit">
                        Annuler
                    </Button>
                    <Button onClick={() => {
                        create();
                        setOpen(false);
                    }} color="primary" autoFocus variant="contained">
                        Ajouter
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}