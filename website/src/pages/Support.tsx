import { Box, Button, Container, Stack, Typography } from '@mui/material';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import { SUPPORT_EMAIL } from '../config';

const FAQ = [
  {
    q: 'How do I open the side panel?',
    a: 'Click the Stash icon in the toolbar. For one-click access, pin it: open the puzzle-piece menu in Chrome and click the pin next to Stash.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Everything stays in your browser via Chrome\'s local storage. Stash makes no network requests and never sends your tabs anywhere.',
  },
  {
    q: 'Will I lose my folders if I uninstall the extension?',
    a: 'Yes — local storage is wiped when an extension is removed. If you plan to reinstall, keep the extension installed until you do.',
  },
  {
    q: 'Does Stash sync across devices?',
    a: 'Not yet. Data is local to each browser. Sync is on the roadmap.',
  },
  {
    q: 'How does auto-organize work?',
    a: 'It looks at the domains of your open tabs and groups similar ones (AI, Code, Social, etc.) into folders. Singletons are skipped.',
  },
  {
    q: 'I found a bug or have a feature request.',
    a: 'Please email me — I read every message.',
  },
];

export function Support() {
  const subject = encodeURIComponent('Stash support');
  return (
    <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h2" gutterBottom>
            Support
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Stuck on something, hit a bug, or want to suggest a feature? Reach out and
            I'll get back to you.
          </Typography>
        </Box>

        <Box
          sx={{
            p: 3,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="h4">Email support</Typography>
              <Typography variant="body2" color="text.secondary">
                Best for bugs, feature requests, and account questions.
              </Typography>
            </Box>
            <Button
              component="a"
              href={`mailto:${SUPPORT_EMAIL}?subject=${subject}`}
              variant="contained"
              startIcon={<EmailRoundedIcon />}
            >
              {SUPPORT_EMAIL}
            </Button>
          </Stack>
        </Box>

        <Box>
          <Typography variant="h3" gutterBottom>
            Frequently asked
          </Typography>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            {FAQ.map((item) => (
              <Box key={item.q}>
                <Typography variant="h4">{item.q}</Typography>
                <Typography variant="body1" color="text.secondary">
                  {item.a}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
