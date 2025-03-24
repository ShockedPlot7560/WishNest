import axios from "axios";
import {styled} from "@mui/material/styles";
import {IconButton} from "@mui/material";
import {Check} from "@mui/icons-material";
import {useState} from "react";

export default function ApproveGroupRequestButton (props: {groupUuid: string, targetUuid: string, onSuccess: () => void}) {
    const [loading, setLoading] = useState(false);

    const acceptGroupRequest = async (groupUuid: string, targetUuid: string) => {
        setLoading(true);
        await axios.post("/users/"+targetUuid+"/groups/"+groupUuid+"/accept")
            .then(response => {
                if(response.data.success){
                    props.onSuccess();
                }
            })
        setLoading(false);
    }

    const AcceptButton = styled(IconButton)(({ theme }) => ({
        backgroundColor: theme.palette.success.main,
    }));

    return (
        <AcceptButton
            edge="end"
            aria-label="delete"
            color="success"
            loading={loading}
            onClick={async () => {
                await acceptGroupRequest(props.groupUuid, props.targetUuid)
            }}
        >
            {!loading && <Check />}
        </AcceptButton>
    );
}