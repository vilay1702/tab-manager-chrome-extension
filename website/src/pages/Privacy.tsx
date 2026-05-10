import { Box, Container, Stack, Typography } from '@mui/material';
import { SUPPORT_EMAIL } from '../config';

const LAST_UPDATED = 'May 10, 2026';

export function Privacy() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h2" gutterBottom>
            Privacy Policy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {LAST_UPDATED}
          </Typography>
        </Box>

        <Typography variant="body1">
          Stash (the "extension") is a Chrome extension that helps you organize your
          browser tabs. This policy explains, in plain terms, what data the extension
          handles and what it does not.
        </Typography>

        <Section title="What we collect">
          The extension does not collect any personal data. All data — including your
          folders, saved tabs, favorites, settings, and recently closed tabs — is
          stored locally in your browser using Chrome's <code>chrome.storage</code>{' '}
          API.
        </Section>

        <Section title="What we share">
          Nothing. The extension makes no network requests and contains no analytics,
          telemetry, or tracking code.
        </Section>

        <Section title="Remote code">
          The extension does not load or execute remote code. All scripts are bundled
          with the extension at build time.
        </Section>

        <Section title="Third parties">None.</Section>

        <Section title="Permissions used">
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            <li>
              <strong>tabs</strong> — to read titles and URLs of tabs you choose to
              stash, favorite, or reopen.
            </li>
            <li>
              <strong>storage</strong> — to save your folders and favorites locally.
            </li>
            <li>
              <strong>sidePanel</strong> — to display the side panel UI.
            </li>
            <li>
              <strong>favicon</strong> — to display site icons next to saved tabs.
            </li>
            <li>
              <strong>alarms</strong> — to prune entries older than 48 hours from the
              "recently closed" list.
            </li>
          </ul>
          No host permissions, no network access, no analytics.
        </Section>

        <Section title="Changes to this policy">
          If this policy changes, we'll update the date at the top. Material changes
          will also be noted in the extension's release notes.
        </Section>

        <Section title="Contact">
          Questions about privacy? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </Section>
      </Stack>
    </Container>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" component="div" color="text.secondary">
        {children}
      </Typography>
    </Box>
  );
}
