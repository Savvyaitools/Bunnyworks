# Remove Realistic wording from AI Workshop page

All Realistic mentions live in `public/workshop.html` (5 occurrences). Replace as follows:

| Line | Current | New |
|---|---|---|
| 552 | `Realistic Photo Generation` | `Realistic Photo Generation` |
| 553 | `Full high-quality content pipeline built for creator monetization` | `Full high-quality content pipeline built for creator monetization` |
| 554 | `Complete Realistic photo set` | `Complete realistic photo set` |
| 560 | `Realistic Video + Workflow Handoff` | `Realistic Video + Workflow Handoff` |
| 581 | `Realistic + High-Quality Pipelines` (h3) and `Two full content stacks` copy | `Realistic + High-Quality Pipelines` |
| 645 | `Realistic + High-Quality photo & video pipelines` | `Realistic + high-quality photo & video pipelines` |

No other files reference Realistic (the matches in `Workshop.tsx` and elsewhere were false positives from base64 image data). Pure copy edit, no logic changes.
