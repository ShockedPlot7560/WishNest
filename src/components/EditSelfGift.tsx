import { IconButton } from "@mui/material";
import axios from "axios";
import { useState } from "react";
import { useAuth } from "../provider/AuthProvider";
import GiftPopup from "./GiftPopup";
import { Edit } from "@mui/icons-material";

export default function EditSelfGift(props: {
    familyId: string,
    gift: {
        uuid: string,
        title: string,
        content: string
    },
    onEdit: () => void
}) {
    const [open, setOpen] = useState(false)
    const {user} = useAuth();

    async function edit(title: string, content: string) {
        await axios.put("/family/" + props.familyId + "/member/" + user?.uuid + "/gift/" + props.gift.uuid, {
            title: title,
            content: content
        }).finally(() => {
            props.onEdit();
        })
    }


    return (
        <>
            <IconButton 
                onClick={() => setOpen(true)}
            >
                <Edit/>
            </IconButton>
            <GiftPopup
                content={props.gift.content}
                title={props.gift.title}
                open={open}
                setOpen={setOpen}
                onAdd={(title: string, content: string) => {
                    return edit(title, content);
                }}
            />
        </>
    );
}