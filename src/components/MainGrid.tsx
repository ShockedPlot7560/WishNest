import Box from '@mui/material/Box';

export default function MainGrid({children}) {
    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            {children}
        </Box>
    );
}