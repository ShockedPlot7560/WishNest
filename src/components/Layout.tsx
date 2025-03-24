import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import SideMenu from './SideMenu';
import MainGrid from "./MainGrid.tsx";
import axios from "axios";
import {useState} from "react";
import {Card, CardContent, CssVarsTheme} from "@mui/material";
import Typography from "@mui/material/Typography";
import AppNavbar from './AppNavbar.tsx';

export default function Layout({children}: { children: React.ReactNode }) {
    const [errors, setErrors] = useState<string[]>([
    ]);

    function addError(error: string) {
        setErrors([...errors, error]);
        setTimeout(() => {
            setErrors(errors.filter(e => e !== error));
        }, 5000);
    }

    axios.interceptors.response.use(
        (response) => {
            if(response.data.error){
                addError(response.data.error);
                throw new Error(response.data.error);
            }else{
                return response;
            }
        },
        (error) => {
            addError(error.message);
            return Promise.reject(error);
        }
    )

    return (
        <Box sx={{ display: 'flex' }}>
            <SideMenu />
            <AppNavbar />
            {/*Main content */}
            <Box
                component="main"
                sx={(theme) => {
                    const cssVarsTheme = theme as unknown as CssVarsTheme; 
                    return {
                        flexGrow: 1,
                        backgroundColor: cssVarsTheme.vars
                            ? `rgba(${cssVarsTheme.vars.palette.background.defaultChannel} / 1)`
                            : alpha(cssVarsTheme.palette.background.default, 1),
                        overflow: 'auto',
                    };
                }}
            >
                <Stack
                    spacing={2}
                    sx={{
                        alignItems: 'center',
                        position: 'relative',
                        mx: 3,
                        pb: 5,
                        mt: { xs: 8, md: 0 },
                    }}
                >
                    <Stack
                        spacing={2}
                        sx={{
                            position: 'fixed',
                            top: '1rem',
                            right: '1rem',
                            zIndex: 1000,
                            width: '20%',
                        }}
                    >
                        {errors.map((error, index) => {
                            return <Card className="MuiCard-error" sx={{
                                padding: 0
                            }} key={index}>
                                <CardContent sx={{
                                    padding: '1rem',
                                    marginBottom: '1rem'
                                }}>
                                    <Typography gutterBottom>{error}</Typography>
                                </CardContent>
                            </Card>
                        })}
                    </Stack>
                    {/*<Header />
                    <MainGrid />*/}
                    <MainGrid>{children}</MainGrid>
                    <Box
                        component="footer"
                        sx={{
                            mt: 'auto',
                            py: 3,
                            px: 2,
                            textAlign: 'center',
                            position: 'absolute',
                            bottom: 0
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            WishNest, an open-source project
                        </Typography>
                        {/* Link to github */}
                        <Typography variant="body2" color="text.secondary">
                            <a href="https://github.com/ShockedPlot7560/WishNest" target="_blank" rel="noopener noreferrer">
                                GitHub
                            </a>
                        </Typography>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
}