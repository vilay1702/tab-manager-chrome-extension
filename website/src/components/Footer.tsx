import { Box, Container, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { SUPPORT_EMAIL } from '../config';

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        mt: 6,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Stash. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={3}>
            <Link component={RouterLink} to="/privacy" color="text.secondary" underline="hover">
              Privacy
            </Link>
            <Link component={RouterLink} to="/support" color="text.secondary" underline="hover">
              Support
            </Link>
            <Link href={`mailto:${SUPPORT_EMAIL}`} color="text.secondary" underline="hover">
              {SUPPORT_EMAIL}
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
