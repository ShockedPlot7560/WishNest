import {Box, Card, CardContent, LinearProgress} from "@mui/material";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import {useEffect, useState} from "react";
import axios from "axios";
import {useAuth} from "../provider/AuthProvider.tsx";
import GiftPrivateContentPopup from "./GiftPrivateContentPopup.tsx";
import { GroupPrivateData } from "../../api/interfaces/index.ts";
import AddSelfGift from "./AddSelfGift.tsx";
import DeleteSelfGift from "./DeleteSelfGift.tsx";
import EditSelfGift from "./EditSelfGift.tsx";

export default function MemberContent(props: {member: null | {uuid: string, name: string}, familyId: string}) {
    const [gifts, setGifts] = useState<null | {
        uuid: string,
        title: string,
        content: string
    }[]>(null);
    const [privateData, setPrivateData] = useState<null | GroupPrivateData>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    function fetchPrivateData() {
        setLoading(true);
        return axios.get("/family/" + props.familyId + "/member/" + props.member?.uuid)
            .then(response => {
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
        setGifts(null);
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
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                }}>
                    <Typography variant="h3" sx={{ marginBottom: { xs: '1rem', sm: 0 } }}>
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
                    <LinearProgress />
                </Stack>}
                {gifts !== null && gifts.map((gift, index) => (
                    <Card sx={{marginTop: '1rem'}} key={index}>
                        <CardContent>
                            <Stack direction="row" spacing={2} sx={{
                                justifyContent: 'space-between'
                            }}>
                                <Typography variant="h5">
                                    {gift.title}
                                </Typography>
                                {props.member?.uuid === user?.uuid &&
                                <EditSelfGift
                                    familyId={props.familyId}
                                    gift={gift}
                                    onEdit={() => {
                                        fetchPrivateData();
                                    }}
                                />}
                            </Stack>
                            <Typography variant="body1">
                                {gift.content}
                            </Typography>
                        </CardContent>
                        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{
                            alignItems: 'center'
                        }}>
                            <Stack direction="row" spacing={2}>
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
                            </Stack>
                            {privateData === null && <Typography>
                                {props.member?.uuid === user?.uuid ?
                                    "Vous ne pouvez pas accéder aux données privées de votre propre liste de souhaits" :
                                    "Vous n'avez pas les droits pour accéder aux données privées de cette liste, attendez qu'un membre vous accepte"}
                            </Typography>}
                        </Stack>
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