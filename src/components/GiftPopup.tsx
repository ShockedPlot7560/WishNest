import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import { useState } from "react";

export default function GiftPopup(props: {
    setOpen: (open: boolean) => void,
    open: boolean,
    content: string | null,
    title: string | null,
    onAdd: (title: string, content: string) => Promise<void>
}) {
    const [title, setTitle] = useState(props.title);
    const [content, setContent] = useState(props.content);
    const [loading, setLoading] = useState(false);
    const edit = props.content !== null && props.title !== null;

    return (

        <Dialog open={props.open} onClose={() => props.setOpen(false)}>
        <DialogTitle>
            {edit ? "Modifier le cadeau" : "Proposer un cadeau"}
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
                value={title}
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
                multiline
                rows={4}
                variant="standard"
                value={content}
                onChange={(e) => {
                    setContent(e.target.value);
                }}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => props.setOpen(false)} color="inherit">
                Annuler
            </Button>
            <Button onClick={() => {
                if(!title || !content) {
                    return;
                }
                setLoading(true);
                props.onAdd(title, content)
                    .finally(() => {
                        setLoading(false);
                        props.setOpen(false);
                    });
            }} color="primary" variant="contained">
                {edit ? "Modifier" : "Proposer"}
            </Button>
        </DialogActions>
    </Dialog>
    );
}