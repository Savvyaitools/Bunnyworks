# Remove NSFW wording from AI Workshop page

All NSFW mentions live in `public/workshop.html` (5 occurrences). Replace as follows:

| Line | Current | New |
|---|---|---|
| 552 | `NSFW Photo Generation` | `Realistic Photo Generation` |
| 553 | `Full adult content pipeline built for creator monetization` | `Full high-quality content pipeline built for creator monetization` |
| 554 | `Complete NSFW photo set` | `Complete realistic photo set` |
| 560 | `NSFW Video + Workflow Handoff` | `Realistic Video + Workflow Handoff` |
| 581 | `SFW + NSFW Pipelines` (h3) and `Two full content stacks` copy | `Realistic + High-Quality Pipelines` |
| 645 | `SFW + NSFW photo & video pipelines` | `Realistic + high-quality photo & video pipelines` |

No other files reference NSFW (the matches in `Workshop.tsx` and elsewhere were false positives from base64 image data). Pure copy edit, no logic changes.
