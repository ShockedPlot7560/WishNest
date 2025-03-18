import {Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, Divider, Grid2, IconButton, Paper, TextField, Typography} from "@mui/material";
import {useAuth} from "../provider/AuthProvider.tsx";
import React, { useEffect, useState } from "react";
import { Check, Close, Lock, PriorityHigh, Send } from "@mui/icons-material";
import MessageLeft from "./MessageLeft.tsx";
import MessageRight from "./MessageRight.tsx";
import { GiftPrivateData } from "../../api/interfaces/index.ts";
import axios from "axios";
import GiftAcceptButton from "./GiftAcceptButton.tsx";
import GiftDenyButton from "./GiftDenyButton.tsx";

export default function GiftPrivateContentPopup(props: {gift: {
    uuid: string,
    title: string,
    content: string
}, private_data: null | GiftPrivateData, memberId: string, familyId: string, updatePrivateData: () => Promise<any>}) {
    const [ open, setOpen ] = useState(false);
    const [message, setMessage] = useState<string|null>(null);
    const [members, setMembers] = useState<null | {uuid: string, name: string, email: string}[]>(null);
    const [chatLoading, setChatLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        setChatLoading(true);
        Promise.all([
            props.updatePrivateData(),
            fetchMembers()
        ]).finally(() => {
            setChatLoading(false);
        })
    }, [open]);

    async function fetchMembers() {
        return axios.get(import.meta.env.VITE_API_BASE_URL + "/family/" + props.familyId)
            .then(response => {
                setMembers(response.data.members);
            });
    }

    function sendMessage() {
        axios.post(import.meta.env.VITE_API_BASE_URL + "/family/" + props.familyId + "/member/" + props.memberId + "/gift/" + props.gift.uuid + "/message", {
            message: message
        })
            .then(response => {
                setMessage("");
                props.updatePrivateData();
            })
    }

    return (
        <React.Fragment>
            <Button
                disabled={props.private_data === null}
                variant={"outlined"}
                endIcon={props.private_data === null ? <Lock/> : null}
                onClick={props.private_data === null ? () => {} : () => {
                    setOpen(true);
                }}
            >Voir plus</Button>
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth={"lg"}>
                <DialogActions>
                    <IconButton onClick={() => setOpen(false)}>
                        <Close   />
                    </IconButton>
                </DialogActions>
                <DialogContent>
                    <Grid2 container spacing={2}>
                        <Grid2 size={{
                            xs: 12,
                            sm: 12,
                            md: 5
                        }}>
                            <Paper sx={{
                                padding: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: "space-between",
                                alignItems: "center",
                                height: '100%',
                                zIndex: 2
                            }}>
                                <Box>
                                    <Typography variant="caption">
                                        Ces données sont privées et ne peuvent être consultées que par les membres de la famille ayant les droits nécessaires.
                                    </Typography>
                                    <Divider sx={{my: 2}}/>
                                    <Typography variant="h6">
                                        {props.gift.title}
                                    </Typography>
                                    <Typography variant="body1">
                                        {props.gift.content}
                                    </Typography>
                                    <Divider sx={{my: 2}}/>
                                    {props.private_data && 
                                    props.private_data?.takenBy && 
                                    (props.private_data.takenBy === user?.uuid ? 
                                        (<Alert icon={<PriorityHigh fontSize="inherit" />} severity="warning" sx={{mb: 2}}>
                                            Vous avez prévu de prendre ce cadeau
                                        </Alert>) : 
                                        (<Alert icon={<Check fontSize="inherit" />} severity="success" sx={{mb: 2}}>
                                            Ce cadeau a été pris par <strong>{members?.find((v) => v.uuid === props.private_data?.takenBy)?.name}</strong>
                                        </Alert>))}
                                </Box>
                                <Box sx={{
                                    width: "100%",
                                    display: "flex",
                                    flexWrap: "wrap",
                                }}>
                                    {!props.private_data?.takenBy &&
                                        <GiftAcceptButton
                                            familyId={props.familyId}
                                            giftUuid={props.gift.uuid}
                                            memberId={props.memberId}
                                            onUpdated={props.updatePrivateData}
                                        />
                                    }
                                    {props.private_data?.takenBy === user?.uuid && 
                                        <GiftDenyButton
                                            familyId={props.familyId}
                                            giftUuid={props.gift.uuid}
                                            memberId={props.memberId}
                                            onUpdated={props.updatePrivateData}
                                        />
                                    }
                                </Box>
                            </Paper>
                        </Grid2>
                        <Grid2 size={{
                            xs: 12,
                            sm: 12,
                            md: 7
                        }}>
                            <Paper sx={{
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                flexDirection: 'column',
                                height: '100%',
                                zIndex: 2
                            }}>
                            {chatLoading ? <div style={{
                                height: "60vh",
                            }}>
                                <CircularProgress></CircularProgress> 
                            </div>:
                                <>
                                <div style={{
                                    padding: 2,
                                    width: '100%',
                                    height: "60vh",
                                    overflowY: 'auto'
                                }}>
                                    {props.private_data === null && <CircularProgress></CircularProgress>}
                                    {props.private_data?.messages && props.private_data.messages.map((message, index) => {
                                        const u = members?.find((v) => v.uuid === message.user_uuid);
                                        if(!u){
                                            return;
                                        }

                                        if(u?.uuid === user?.uuid){
                                            return (
                                                <MessageRight
                                                    key={index}
                                                    message={message.content}
                                                    timestamp={message.timestamp}
                                                    displayName={"Vous"}
                                                />
                                            );
                                        }
                                        return (
                                            <MessageLeft
                                                key={index}
                                                message={message.content}
                                                timestamp={message.timestamp}
                                                displayName={u.name}
                                            />
                                        );
                                    })}
                                </div>
                                <form style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    width: '95%',
                                    gap: '1rem'
                                }}  noValidate autoComplete="off"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        sendMessage();
                                    }}>
                                    <TextField
                                        id="message"
                                        sx={{
                                            width: '100%'
                                        }}
                                        value={message}
                                        onChange={(e) => {
                                            setMessage(e.target.value)
                                        } }
                                    />
                                    <Button variant="contained" color="primary" onClick={(e) => {
                                        e.preventDefault();
                                        sendMessage();
                                    }}>
                                        <Send />
                                    </Button>
                                </form>
                                </>}
                            </Paper>
                        </Grid2>
                    </Grid2>
                </DialogContent>
            </Dialog>
        </React.Fragment>
    );
}