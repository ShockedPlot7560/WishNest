import axios from "axios";
import {IconButton} from "@mui/material";
import {Delete} from "@mui/icons-material";
import {useState} from "react";

export default function DeleteFamilyInvitation(props: {uuid: string, onDelete: () => void}) {
    const [loading, setLoading] = useState(false);

    return (
        <IconButton
            edge="end"
            aria-label="Supprimer"
            loading={loading}
            onClick={() => {
                setLoading(true);
                axios.delete(import.meta.env.VITE_API_BASE_URL + "/invitations/"+props.uuid)
                    .then(() => {
                        props.onDelete();
                    }).finally(() => setLoading(false));
            }}
        >
            {!loading && <Delete/>}
        </IconButton>
    );
}