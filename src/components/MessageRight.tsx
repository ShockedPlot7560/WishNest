import { Avatar, Box, Paper, Typography } from "@mui/material";

export default function MessageRight(props: { message: string; timestamp: string; photoURL?: string; displayName: string; }) {
    return (
        <Box mb={2} sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            mb: 2,
            textAlign: "right",
            width: "100%",
        }}>
            <Box textAlign="right" sx={{
                width: "70%",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
            }}>
                <Typography variant="body2" color="textSecondary">
                    {props.displayName}
                </Typography>
                <Paper
                    elevation={6}
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
            <Avatar src={props.photoURL} alt={props.displayName} sx={{ ml: 2 }} />
        </Box>
    );
}