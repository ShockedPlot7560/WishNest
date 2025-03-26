import Stack from '@mui/material/Stack';
import {useAuth} from "../provider/AuthProvider.tsx";
import FamilySideContent from "./FamilySideContent.tsx";
import FamilyInvitationsSideContent from "./FamilyInvitationsSideContent.tsx";
import { useEffect, useState } from 'react';
import { Family } from '../../api/interfaces/index.ts';
import axios from 'axios';

export default function MenuContent({onClick}: {onClick: () => void}) {
    const [families, setFamilies] = useState<Family[]|null>(null);
    const { user } = useAuth();

    function fetchFamilies() {
        setFamilies(null);
        axios.get("/users/" + user?.uuid + "/families")
            .then(response => {
                setFamilies(response.data);
            }).catch(() => {
                setFamilies([]);
            });
    }

    useEffect(() => {
        fetchFamilies();
    }, [user?.uuid]);

    return (
        <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
            <Stack>
                <FamilySideContent onClick={onClick} families={families} updateFamilies={fetchFamilies}/>
                <FamilyInvitationsSideContent refreshFamilies={fetchFamilies}/>
            </Stack>
        </Stack>
    );
}