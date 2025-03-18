import { Avatar, Box, Paper, Typography } from "@mui/material";

export default function MessageLeft(props: { message: string; timestamp: string; photoURL?: string; displayName: string; }) {
    return (
        <Box sx={{
            display: "flex",
            alignItems: "flex-start",
            mb: 2,
            width: "100%",
            textAlign: "left",
        }}>
            <Avatar src={props.photoURL} alt={props.displayName} sx={{ mr: 2 }} />
            <Box sx={{
                width: "70%",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
            }}>
                <Typography variant="body2" color="textSecondary">
                    {props.displayName}
                </Typography>
                <Paper
                    elevation={3}
                    sx={{
                        borderRadius: "10px",
                        padding: "10px",
                        maxWidth: "70%",
                    }}
                >
                    <Typography variant="body1">{props.message}</Typography>
                </Paper>
                <Typography variant="caption" color="textSecondary">
                    {props.timestamp}
                </Typography>
            </Box>
        </Box>
    );
}