import { Box, Button, Container, Stack, Typography } from "@mui/material";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { CHROME_STORE_URL } from "../config";

const features = [
  {
    icon: <FolderOpenRoundedIcon fontSize="medium" />,
    title: "Folders for everything",
    body: "Drag a tab. Drop it in a folder. That's it. Make folders for projects, recipes, weekend plans, whatever.",
  },
  {
    icon: <StarRoundedIcon fontSize="medium" />,
    title: "Pin your favorites",
    body: "Keep up to 8 favorite sites right at the top. Press ⌘D or Ctrl+D to bookmark whatever you're reading.",
  },
  {
    icon: <AutoFixHighRoundedIcon fontSize="medium" />,
    title: "One click cleanup",
    body: "Got 60 tabs open? Hit Auto Organize and watch Stash sort them by topic. Like magic, but real.",
  },
  {
    icon: <SearchRoundedIcon fontSize="medium" />,
    title: "Find anything fast",
    body: "Type to search across open tabs, favorites, and saved tabs at once. Press / to jump in, Esc to clear.",
  },
  {
    icon: <RestoreRoundedIcon fontSize="medium" />,
    title: "Closed it? Bring it back",
    body: "Closed a tab by mistake? No worries. Stash keeps the last two days handy, ready to reopen.",
  },
  {
    icon: <LockRoundedIcon fontSize="medium" />,
    title: "Yours, only yours",
    body: "Everything lives in your browser. No sign up. No tracking. No analytics. Pinky promise.",
  },
];

export function Landing() {
  return (
    <Box>
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background:
            "linear-gradient(180deg, rgba(138,180,248,0.10) 0%, rgba(138,180,248,0) 100%)",
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Stash logo"
              sx={{ width: 88, height: 88, mb: 1 }}
            />
            <Typography variant="h1">Tabs, finally tidy.</Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 620, fontSize: "1.15rem" }}
            >
              Drowning in tabs? Stash is a tiny Chrome extension that tucks into
              your side panel. Drop tabs into folders, save your favorites, and
              bring back anything you closed by mistake. All without leaving
              the page you're on.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component="a"
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener"
                variant="contained"
                size="large"
              >
                Add to Chrome (it's free)
              </Button>
              <Button
                component="a"
                href="#features"
                variant="outlined"
                size="large"
                sx={{ color: "text.primary", borderColor: "divider" }}
              >
                Show me what it does
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              No sign up · Works offline · Always free
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" id="features" sx={{ py: { xs: 6, md: 10 } }}>
        <Stack spacing={1} sx={{ mb: 5 }} style={{ alignItems: "center" }}>
          <Typography align="center" variant="h2">
            Six little things you'll love
          </Typography>
          <Typography
            align="center"
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 640 }}
          >
            Made for people who always have too many tabs open. (We get it.
            We're those people too.)
          </Typography>
        </Stack>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1fr 1fr 1fr",
            },
          }}
        >
          {features.map((f) => (
            <Box
              key={f.title}
              sx={{
                p: 3,
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Box sx={{ color: "primary.main", mb: 1.5 }}>{f.icon}</Box>
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

      <Box sx={{ bgcolor: "action.hover", py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md">
          <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
            <Typography variant="h2">Why the side panel?</Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 640 }}
            >
              Other tab managers grab a whole tab or pop up right over your
              work. Stash slides in next to what you're already doing, quietly,
              so you stay in the zone.
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
              Try Stash today
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
