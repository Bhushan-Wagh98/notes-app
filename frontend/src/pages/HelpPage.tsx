import { Container, Paper, Typography, Box, Link } from "@mui/material";

const helpSections = [
  {
    title: "1. Get Started",
    img: "https://raw.githubusercontent.com/Bhushan-Wagh98/notes/main/screenshots/copy.jpg",
    items: [
      <>After opening our website <code>http://share-note.netlify.app/</code> your note will create automatically.</>,
      "As you can see in the above image, you can copy the link of your note and share it to anywhere and to anyone.",
      <>And you can also create a fresh note after clicking the <code>create new note</code> button.</>,
    ],
  },
  {
    title: "2. Output",
    img: "https://raw.githubusercontent.com/Bhushan-Wagh98/notes/main/screenshots/live%20change.png",
    items: [
      "You can edit your note as well as anyone with the link can edit and make changes in your note.",
      "As you can see the above image, when you edit the note, the output is shown everywhere.",
    ],
  },
  {
    title: "3. Additional Feature",
    img: "https://raw.githubusercontent.com/Bhushan-Wagh98/notes/main/screenshots/print%20button.jpg",
    items: ["We provided you the print button as additional feature."],
  },
  {
    title: "4. Print",
    img: "https://raw.githubusercontent.com/Bhushan-Wagh98/notes/main/screenshots/print.png",
    items: [
      <>After clicking the <code>Print</code> button, you can print your note or you can save your note as <code>PDF</code>.</>,
    ],
  },
];

function HelpPage() {
  return (
    <Box>
      <Typography variant="h4" align="center" sx={{ mt: 3, fontWeight: 600 }}>
        Help
      </Typography>
      <Typography variant="body1" align="center" sx={{ width: "80%", mx: "auto", mt: 1 }}>
        You don't need to share your personal information with us. Just visit{" "}
        <Link href="/" target="_blank" sx={{ fontWeight: 600 }}>Share Notes</Link> and improve your productivity.
      </Typography>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={1} sx={{ p: { xs: 2, md: 6 } }}>
          {helpSections.map((section) => (
            <Box key={section.title} sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>{section.title}</Typography>
              <Box
                component="img"
                src={section.img}
                alt={section.title}
                sx={{ width: "100%", borderRadius: 2.5, boxShadow: 3 }}
              />
              <ul>
                {section.items.map((item, i) => (
                  <li key={i}><Typography variant="body2">{item}</Typography></li>
                ))}
              </ul>
            </Box>
          ))}
        </Paper>
      </Container>
    </Box>
  );
}

export default HelpPage;
