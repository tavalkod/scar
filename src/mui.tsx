import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    List,
    ListItem,
    Divider,
    ThemeProvider,
    createTheme,
    CssBaseline,
    Drawer,
    ListItemIcon,
    ListItemText,
    AppBar,
    Toolbar,
    ListItemButton,
} from '@mui/material';
import {
    CloudUpload,
    FolderOpen,
    Terminal,
    Monitor,
    Analytics,
    Settings,
    Help,
    Notifications,
    WifiTethering,
    MoreVert
} from '@mui/icons-material';


import {

    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,

    LinearProgress
} from '@mui/material';
import {
    TrendingUp,
    Person
} from '@mui/icons-material';


import {

    Tabs,
    Tab,

} from '@mui/material';
import {

    WarningAmber
} from '@mui/icons-material';

type Tabs = "uploadHub" | "tactics" | "bigPicture";

// Custom theme to match the Tactical Command Interface
const sc2Theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#f26419',
        },
        background: {
            default: '#0b0e14',
            paper: '#10131a',
        },
        surface: {
            dim: '#10131a',
            bright: '#363940',
            containerLow: '#191c22',
        },
        text: {
            primary: '#ffffff',
            secondary: '#94a3b8',
        },
    },
    typography: {
        fontFamily: 'Geist, sans-serif',
        h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' },
        h2: { fontSize: '1.5rem', fontWeight: 600 },
        overline: { letterSpacing: '0.2em', fontWeight: 600 },
        button: { textTransform: 'uppercase', fontWeight: 700 },
    },
    shape: {
        borderRadius: 4,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    border: '1px solid #363940',
                },
            },
        },
    },
});

const Sidebar = ({ tab, setTab }: { tab: Tabs, setTab: (t: Tabs) => void }) => (
    <Drawer
        variant="permanent"
        sx={{
            width: 280,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
                width: 280,
                boxSizing: 'border-box',
                backgroundColor: '#0b0e14',
                borderRight: '1px solid #363940',
                padding: '24px 16px',
            },
        }}
    >
        <Box sx={{ mb: 6 }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 800, letterSpacing: '-0.05em' }}>
                SCore 🪨
            </Typography>
        </Box>

        <List sx={{ flexGrow: 1 }}>
            {[
                { text: 'My Replays', icon: <Terminal />, name: "uploadHub" },
                { text: 'Tactics', icon: <Monitor />, name: "tactics" },
                { text: 'Pig Picture', icon: <Analytics />, name: "bigPicture" },
            ].map((item) => (
                <ListItemButton
                    onClick={() => setTab(item.name)}
                    key={item.text}
                    sx={{
                        mb: 1,
                        bgcolor: item.name === tab ? 'primary.main' : 'transparent',
                        color: item.name === tab ? 'common.black' : 'inherit',
                        '&:hover': { bgcolor: item.name === tab ? 'primary.dark' : 'rgba(255,255,255,0.05)' }
                    }}


                >
                    <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{ variant: 'overline' }} />
                </ListItemButton>
            ))}
        </List>

        {/*<Button variant="contained" fullWidth sx={{ mb: 4, py: 1.5 }}>
      UPLOAD REPLAY
    </Button>*/}

        <Divider sx={{ mb: 2, opacity: 0.1 }} />
        <List>
            <ListItem button><ListItemIcon><Settings /></ListItemIcon><ListItemText primary="Settings" /></ListItem>
            <ListItem button><ListItemIcon><Help /></ListItemIcon><ListItemText primary="Support" /></ListItem>
        </List>
    </Drawer>
);

const TopBar = () => (
    <AppBar
        position="fixed"
        sx={{
            width: 'calc(100% - 280px)',
            ml: '280px',
            bgcolor: 'rgba(25, 28, 34, 0.9)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid #363940',
            boxShadow: 'none'
        }}
    >
        <Toolbar sx={{ justifyContent: 'space-between' }}>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 4 }}>
                    {['GLOBAL RANKINGS', 'MAP POOL', 'METAGAME'].map(link => (
                        <Typography key={link} variant="caption" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                            {link}
                        </Typography>
                    ))}
                </Box>
                <IconButton size="small"><Notifications /></IconButton>
                <IconButton size="small"><WifiTethering /></IconButton>
            </Box>
        </Toolbar>
    </AppBar>
);

const replays = [
    { matchup: 'TvZ', map: 'Alcyone LE', result: 'WIN', time: '14:55 MIN', apm: 312, sq: 88.4 },
    { matchup: 'TvP', map: 'Post-Youth LE', result: 'LOSS', time: '08:22 MIN', apm: 285, sq: 74.2 },
    { matchup: 'TvT', map: 'Site Delta LE', result: 'WIN', time: '24:12 MIN', apm: 299, sq: 91.0 },
];

const UploadHub = () => (<>
    {/* Drop Zone */}
    <Paper
        sx={{
            p: 8,
            mb: 6,
            textAlign: 'center',
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.1)',
            background: 'linear-gradient(rgba(242, 100, 25, 0.02), transparent)'
        }}
    >
        <CloudUpload sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} color="primary" />
        <Typography variant="h5" gutterBottom>Drop Replays Here</Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained">Browse Files</Button>
            <Button variant="outlined" startIcon={<FolderOpen />}>Open Folder</Button>
        </Box>
    </Paper>

    {/* Recent Replays List */}
    <Typography variant="overline" color="primary">DATA STREAM</Typography>
    <Typography variant="h6" sx={{ mb: 4 }}>Recent Replays</Typography>

    <List>
        {replays.map((replay, idx) => (
            <Paper key={idx} sx={{ mb: 2, bgcolor: '#191c22', borderRadius: 0 }}>
                <ListItem sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box sx={{
                            px: 2, py: 1,
                            border: '1px solid',
                            borderColor: replay.result === 'WIN' ? 'primary.main' : 'error.main',
                            minWidth: 80, textAlign: 'center', mr: 3
                        }}>
                            <Typography variant="caption" display="block">RESULT</Typography>
                            <Typography variant="h6" sx={{ color: replay.result === 'WIN' ? 'primary.main' : 'error.main' }}>
                                {replay.result}
                            </Typography>
                        </Box>

                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1">{replay.matchup} - {replay.map}</Typography>
                            <Typography variant="caption" color="text.secondary">2024.05.12 14:32 • {replay.time}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 6, mr: 4 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary" display="block">APM</Typography>
                                <Typography variant="h6">{replay.apm}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary" display="block">SQ</Typography>
                                <Typography variant="h6">{replay.sq}</Typography>
                            </Box>
                        </Box>

                        <IconButton><MoreVert /></IconButton>
                    </Box>
                </ListItem>
            </Paper>
        ))}
    </List>

    <Button fullWidth variant="text" sx={{ mt: 2, opacity: 0.5 }}>VIEW ALL REPLAYS</Button>

    {/* Footer Stats */}
    <Box sx={{
        mt: 8, p: 2, border: '1px solid #363940',
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'monospace', fontSize: '0.75rem', opacity: 0.6
    }}>
        <Box sx={{ display: 'flex', gap: 4 }}>
            <span>SYSTEM: STABLE</span>
            <span>PACKETS: RECEIVING</span>
        </Box>
        <Box sx={{ display: 'flex', gap: 4 }}>
            <span>LATENCY: 14MS</span>
            <span>UPTIME: 04:12:55</span>
        </Box>
    </Box>
</>)
const StrategicIntel = () => {
    const matches = [
        { result: 'WIN', map: 'GHOST RIVER LE', matchup: 'TvZ', length: '14:22', apm: 261 },
        { result: 'LOSS', map: 'POST-YOUTH LE', matchup: 'TvP', length: '08:45', apm: 210 },
        { result: 'WIN', map: 'OCEANBORN LE', matchup: 'TvT', length: '21:50', apm: 244 },
    ];

    return (
        <Box component="main" sx={{ flexGrow: 1, p: 4, bgcolor: '#10131a' }}>
            <Box sx={{ mb: 6, borderLeft: '4px solid #f26419', pl: 3 }}>
                <Typography variant="overline" sx={{ opacity: 0.6 }}>SESSION SUMMARY</Typography>
                <Typography variant="h2">MULTI-REPLAY ANALYSIS</Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 6 }}>
                {/* Win Rate */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 4, height: '100%', borderRadius: 0 }}>
                        <Typography variant="h6" sx={{ mb: 4 }}>OVERALL WIN RATE</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                            <Typography variant="h2" color="primary">62.4%</Typography>
                            <Typography variant="caption" color="success.main">+4.2% VS PREV</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', mt: 4, gap: 1 }}>
                            <Box sx={{ flex: 31, height: 12, bgcolor: 'primary.main' }} />
                            <Box sx={{ flex: 19, height: 12, bgcolor: '#363940' }} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption">TOTAL WINS: 31</Typography>
                            <Typography variant="caption">TOTAL LOSSES: 19</Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Performance Metrics */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 4, height: '100%', borderRadius: 0 }}>
                        <Typography variant="h6" sx={{ mb: 4 }}>MACRO PERFORMANCE</Typography>
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">AVG APM</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>248</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={75} sx={{ height: 4 }} />
                        </Box>
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">AVG EPM</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>192</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={60} sx={{ height: 4 }} />
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">SUPPLY BLOCK / 10M</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>0:24</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={20} color="error" sx={{ height: 4 }} />
                        </Box>
                    </Paper>
                </Grid>

                {/* Matchup Data */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 4, height: '100%', borderRadius: 0 }}>
                        <Typography variant="h6" sx={{ mb: 4 }}>MATCHUP DATA</Typography>
                        {['TvT', 'TvZ', 'TvP'].map((m, i) => (
                            <Box key={m} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
                                <Person sx={{ mr: 2, opacity: 0.5 }} />
                                <Typography variant="body1" sx={{ flexGrow: 1 }}>{m}</Typography>
                                <Typography variant="h6" color="primary" sx={{ mr: 2 }}>{68 - (i * 7)}%</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.5 }}>{17 + i} MATCHES</Typography>
                            </Box>
                        ))}
                    </Paper>
                </Grid>
            </Grid>

            {/* Recent Critical Matches */}
            <Typography variant="h6" sx={{ mb: 3 }}>RECENT CRITICAL MATCHES</Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 0, bgcolor: 'transparent' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>RESULT</TableCell>
                            <TableCell>MAP</TableCell>
                            <TableCell>MATCHUP</TableCell>
                            <TableCell>LENGTH</TableCell>
                            <TableCell>APM</TableCell>
                            <TableCell align="right">ACTION</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {matches.map((row, idx) => (
                            <TableRow key={idx}>
                                <TableCell sx={{ color: row.result === 'WIN' ? 'primary.main' : 'error.main', fontWeight: 700 }}>
                                    {row.result}
                                </TableCell>
                                <TableCell>{row.map}</TableCell>
                                <TableCell>{row.matchup}</TableCell>
                                <TableCell>{row.length}</TableCell>
                                <TableCell>{row.apm}</TableCell>
                                <TableCell align="right">
                                    <Button size="small" variant="text" sx={{ opacity: 0.6 }}>ANALYZE</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};


const MacroAnalysis = () => {
    return (
        <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4, mt: 8 }}>
                <Typography variant="overline" color="primary" sx={{ display: 'block' }}>
                    LIVE ENGAGEMENT REPLAY // ANALYSIS MODE
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>PVZ ON ALCYONE</Typography>
                    <Paper sx={{ px: 2, py: 0.5, bgcolor: 'rgba(255,255,255,0.05)' }}>
                        <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>00:14:32</Typography>
                    </Paper>
                </Box>
                <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#60a5fa' }} /> PLAYER 1: TERRAN_ARCHON
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#c084fc' }} /> PLAYER 2: BLADES_OF_AIUR
                    </Typography>
                </Box>
            </Box>

            <Tabs value={0} sx={{ mb: 4, borderBottom: '1px solid #363940' }}>
                <Tab label="MACRO" sx={{ px: 6, bgcolor: 'rgba(242, 100, 25, 0.1)', color: 'primary.main' }} />
                <Tab label="MICRO" sx={{ px: 6 }} />
                <Tab label="UNIT COMPOSITIONS" sx={{ px: 6 }} />
            </Tabs>

            <Grid container spacing={3}>
                {/* Worker Count Chart Placeholder */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, height: '400px', position: 'relative' }}>
                        <Typography variant="overline" color="text.secondary">METRIC: ECONOMY_SCALE</Typography>
                        <Typography variant="h6">WORKER COUNT OVER TIME</Typography>
                        {/* Visual Placeholder for the bar chart */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: '250px', mt: 4 }}>
                            {[20, 35, 45, 60, 55, 70, 85, 90, 95, 100].map((h, i) => (
                                <Box key={i} sx={{ flex: 1, bgcolor: 'primary.main', opacity: 0.3 + (i * 0.07), height: `${h}%` }} />
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                            <Box><Typography variant="caption" color="text.secondary">PEAK COUNT</Typography><Typography variant="h6">84</Typography></Box>
                            <Box><Typography variant="caption" color="text.secondary">AVG SATURATION</Typography><Typography variant="h6">92%</Typography></Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Spending Quotient */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="overline" color="text.secondary" sx={{ alignSelf: 'flex-start' }}>METRIC: EFFICIENCY_SQ</Typography>
                        <Typography variant="h6" sx={{ alignSelf: 'flex-start', mb: 4 }}>SPENDING QUOTIENT</Typography>

                        <Box sx={{ position: 'relative', width: 180, height: 180, border: '4px solid #363940', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h2" sx={{ fontWeight: 800 }}>128</Typography>
                                <Typography variant="caption" color="primary">RANK: GRANDMASTER</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ width: '100%', mt: 4 }}>
                            <Typography variant="caption">TARGET SQ: 110+</Typography>
                            <LinearProgress variant="determinate" value={90} sx={{ height: 8, bgcolor: '#363940' }} />
                        </Box>
                    </Paper>
                </Grid>

                {/* Unspent Resources */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>UNSPENT RESOURCES</Typography>
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Minerals</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.6 }}>642 AVG</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={70} sx={{ height: 12, bgcolor: '#363940' }} />
                        </Box>
                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Vespene Gas</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.6 }}>215 AVG</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={30} sx={{ height: 12, bgcolor: '#363940' }} />
                        </Box>
                        <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderLeft: '4px solid #f26419' }}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Spending peaks detected during the 3rd base transition. Consider adding 2 additional Production Structures.
                            </Typography>
                        </Paper>
                    </Paper>
                </Grid>

                {/* Supply Block */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <WarningAmber color="primary" />
                            <Typography variant="h6">SUPPLY BLOCK DURATION</Typography>
                        </Box>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'transparent' }}>
                                    <Typography variant="caption" color="text.secondary">TOTAL TIME</Typography>
                                    <Typography variant="h4">01:14</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'transparent' }}>
                                    <Typography variant="caption" color="text.secondary">INCIDENTS</Typography>
                                    <Typography variant="h4">4</Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                        <Typography variant="overline" color="text.secondary">CRITICALITY RATING</Typography>
                        <LinearProgress variant="determinate" value={85} sx={{ height: 8, bgcolor: '#363940', mb: 2 }} />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};


const Main = () => {


    const [tab, setTab] = useState<Tabs>("uploadHub")

    return (
        <ThemeProvider theme={sc2Theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex' }}>
                <Sidebar tab={tab} setTab={setTab} />
                <Box component="main" sx={{ flexGrow: 1, p: 4, mt: 8, bgcolor: '#10131a', minHeight: '100vh' }}>
                    <TopBar />
                    {tab === "uploadHub" && <UploadHub />}
                    {tab === "tactics" && <MacroAnalysis />}
                    {tab === "bigPicture" && <StrategicIntel />}

                </Box>
            </Box>
        </ThemeProvider>
    );
};



export default Main;