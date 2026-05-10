import { Box, Button, Container, Stack, Typography } from '@mui/material';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { CHROME_STORE_URL } from '../config';

const features = [
  {
    icon: <FolderOpenRoundedIcon fontSize="medium" />,
    title: 'Organize into folders',
    body: 'Drag any tab into a colorful folder. Folders collapse so the panel stays clean.',
  },
  {
    icon: <StarRoundedIcon fontSize="medium" />,
    title: 'Favorites, one click away',
    body: 'Pin up to 8 sites at the top. ⌘D / Ctrl+D favorites the current tab instantly.',
  },
  {
    icon: <AutoFixHighRoundedIcon fontSize="medium" />,
    title: 'Auto-organize',
    body: 'One click groups similar open tabs into folders — perfect for taming a crowded window.',
  },
  {
    icon: <SearchRoundedIcon fontSize="medium" />,
    title: 'Search everything',
    body: 'Filter live tabs, favorites, and saved tabs at once. Press / to focus, Esc to clear.',
  },
  {
    icon: <RestoreRoundedIcon fontSize="medium" />,
    title: 'Recently closed',
    body: 'Reopen anything closed in the last 48 hours from a single button.',
  },
  {
    icon: <LockRoundedIcon fontSize="medium" />,
    title: 'Private by design',
    body: 'Everything stays in your browser. No tracking, no analytics, no network requests.',
  },
];

export function Landing() {
  return (
    <Box>
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background:
            'linear-gradient(180deg, rgba(26,115,232,0.06) 0%, rgba(26,115,232,0) 100%)',
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Typography variant="h1">Tabs, organized.</Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 620, fontSize: '1.15rem' }}
            >
              Stash is a Chrome side-panel tab manager. Drag tabs into folders, pin
              favorites, and reopen recently closed tabs — all without leaving the page
              you're on.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                component="a"
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener"
                variant="contained"
                size="large"
              >
                Add to Chrome — Free
              </Button>
              <Button
                component="a"
                href="#features"
                variant="outlined"
                size="large"
                sx={{ color: 'text.primary', borderColor: 'divider' }}
              >
                See features
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              No account needed · Works offline · Open source-friendly
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" id="features" sx={{ py: { xs: 6, md: 10 } }}>
        <Stack spacing={1} sx={{ mb: 5 }}>
          <Typography variant="h2">Everything you need to tame your tabs</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
            Built for people who keep too many tabs open. Stash sits in Chrome's native
            side panel so you never lose your place.
          </Typography>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          }}
        >
          {features.map((f) => (
            <Box
              key={f.title}
              sx={{
                p: 3,
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Box sx={{ color: 'primary.main', mb: 1.5 }}>{f.icon}</Box>
              <Typography variant="h4" gutterBottom>
                {f.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {f.body}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>

      <Box sx={{ bgcolor: 'action.hover', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md">
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Typography variant="h2">Why a side panel?</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
              Most tab managers steal a whole tab or pop up a tiny dialog. Stash uses
              Chrome's native side panel, so your saved tabs sit beside whatever you're
              reading — no context switch.
            </Typography>
            <Button
              component="a"
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener"
              variant="contained"
              size="large"
              sx={{ mt: 1 }}
            >
              Get Stash for Chrome
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
