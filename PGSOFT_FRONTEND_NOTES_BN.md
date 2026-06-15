# PG SOFT Frontend Notes

- Public lobby: `/pgsoft-games`
- Protected game route: `/pgsoft/:gameId`
- Web lobby route: `/pgsoft/lobby`
- Frontend raw provider HTML parse করে না। Backend থেকে one-time launch URL নিয়ে iframe-এর `src` হিসেবে ব্যবহার করে।
- iframe permission PG SOFT document অনুযায়ী: `web-share`, `clipboard-write`, `screen-wake-lock`, `fullscreen`।
- Reload button প্রতিবার নতুন one-time launch ticket তৈরি করে।
- Backend credential incomplete থাকলে lobby page configuration-pending message দেখায়।
