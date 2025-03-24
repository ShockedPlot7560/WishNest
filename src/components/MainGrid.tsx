import Box from '@mui/material/Box';

import { ReactNode } from 'react';

export default function MainGrid({ children }: { children: ReactNode }) {
    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, minHeight: "75vh" }}>
            {children}
        </Box>
    );
}