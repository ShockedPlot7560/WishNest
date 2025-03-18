import {Box, Card, CardActions, CardContent, CircularProgress} from "@mui/material";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import {useEffect, useState} from "react";
import axios from "axios";
import Button from "@mui/material/Button";
import {Lock} from "@mui/icons-material";
import {useAuth} from "../provider/AuthProvider.tsx";
import GiftPrivateContentPopup from "./GiftPrivateContentPopup.tsx";
import { GroupPrivateData } from "../../api/interfaces/index.ts";
import AddSelfGift from "./AddSelfGift.tsx";
import DeleteSelfGift from "./DeleteSelfGift.tsx";

export default function MemberContent(props: {member: null | {uuid: string, name: string}, familyId: string}) {
    const [gifts, setGifts] = useState<null | {
        uuid: string,
        title: string,
        content: string
    }[]>(null);
    const [privateData, setPrivateData] = useState<null | GroupPrivateData>(null);
    const [memberData, setMemberData] = useState<null | {
        gifts: {
            uuid: string,
            title: string,
            content: string
        }[],
        private_data: null | GroupPrivateData
    }>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    function fetchPrivateData() {
        setLoading(true);
        return axios.get(import.meta.env.VITE_API_BASE_URL + "/family/" + props.familyId + "/member/" + props.member?.uuid)
            .then(response => {
                console.log(response.data);
                setGifts(response.data.gifts);
                setPrivateData(response.data.private_data);
                if(response.data.private_data !== null) {
                    setGifts([
                        ...(response.data.gifts ?? []),
                        ...(response.data.private_data?.additional_gifts ?? [])
                    ])
                }
            }).finally(() => {
                setLoading(false);
            });
    }

    useEffect(() => {
        fetchPrivateData();
    }, [props.member]);

    return (<Card>
        <CardContent>
            {props.member === null && <Typography gutterBottom sx={{ color: 'text.secondary' }}>
                Veuillez choisir un membre de la famille dans la liste
            </Typography>}
            {props.member !== null && <>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                }}>
                    <Typography variant="h3">
                        {user?.uuid === props.member.uuid ?
                            "Votre liste de souhaits" :
                            "Liste de souhaits de " + props.member.name}
                    </Typography>
                    {props.member.uuid === user?.uuid && <AddSelfGift
                        familyId={props.familyId}
                        onAdd={() => {
                            fetchPrivateData();
                        }}
                    />}
                </Box>
                {loading && props.member !== null && <Stack sx={{mt: '2rem'}}>
                    <CircularProgress size="4rem"/>
                </Stack>}
                {gifts !== null && gifts.map((gift, index) => (
                    <Card sx={{marginTop: '1rem'}} key={index}>
                        <CardContent>
                            <Typography variant="h5">
                                {gift.title}
                            </Typography>
                            <Typography variant="body1">
                                {gift.content}
                            </Typography>
                        </CardContent>
                        <CardActions>
                            {props.member?.uuid === user?.uuid && 
                                <DeleteSelfGift
                                familyId={props.familyId}
                                giftUuid={gift.uuid}
                                onDelete={() => {
                                    fetchPrivateData();
                                }}
                            />}
                            <GiftPrivateContentPopup 
                                gift={gift} 
                                memberId={props.member?.uuid ?? ''} 
                                familyId={props.familyId}
                                private_data={privateData === null ? null : privateData[gift.uuid]}
                                updatePrivateData={fetchPrivateData}
                            />
                            {privateData === null && <Typography>
                                {props.member?.uuid === user?.uuid ?
                                    "Vous ne pouvez pas accéder aux données privées de votre propre liste de souhaits" :
                                    "Vous n'avez pas les droits pour accéder aux données privées de cette liste, attendez qu'un membre vous accepte"}
                            </Typography>}
                        </CardActions>
                    </Card>
                ))}
                {gifts !== null && gifts.length === 0 && <Typography sx={{
                    marginTop: '1rem'
                }}>
                    Aucun cadeau n'a été ajouté à cette liste
                </Typography>}
            </>}
        </CardContent>
    </Card>)
}