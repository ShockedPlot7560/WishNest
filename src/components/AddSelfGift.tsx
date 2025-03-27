import { Button } from "@mui/material";
import axios from "axios";
import { useState } from "react";
import { useAuth } from "../provider/AuthProvider";
import GiftPopup from "./GiftPopup";

export default function AddSelfGift(props: {
    familyId: string,
    onAdd: () => void
}) {

    const [open, setOpen] = useState(false)
    const {user} = useAuth();

    async function create(title: string, content: string) {
        await axios.post("/family/" + props.familyId + "/member/" + user?.uuid + "/gift", {
            title: title,
            content: content
        }).finally(() => {
            props.onAdd();
        })
    }


    return (
        <>
            <Button 
                variant="contained" 
                onClick={() => setOpen(true)}
            >
                Proposer un cadeau
            </Button>
            <GiftPopup
                content={null}
                title={null}
                open={open}
                setOpen={setOpen}
                onAdd={(title: string, content: string) => {
                    return create(title, content);
                }}
            />
        </>
    );
}