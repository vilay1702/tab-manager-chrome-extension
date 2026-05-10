import { AppBar, Box, Button, Container, Stack, Toolbar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { CHROME_STORE_URL } from '../config';

export function Header() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 64, gap: 2 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              fontWeight: 700,
              fontSize: '1.15rem',
              color: 'text.primary',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
            }}
          >
            Stash
          </Box>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              component={RouterLink}
              to="/privacy"
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              Privacy
            </Button>
            <Button
              component={RouterLink}
              to="/support"
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              Support
            </Button>
            <Button
              component="a"
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener"
              variant="contained"
              size="small"
            >
              Add to Chrome
            </Button>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
