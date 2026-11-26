/* Saves your GitHub contribution graph (private ones included) to contributions.json.
   Runs on GitHub Actions every day. Needs the secret GH_STATS_TOKEN. Run by hand: GH_STATS_TOKEN=... node scripts/fetch-contributions.js */
const fs = require('fs'), path = require('path');
const USER = process.env.GH_USER || 'kaatibyusuf', TOKEN = process.env.GH_STATS_TOKEN, API = process.env.GH_GRAPHQL || 'https://api.github.com/graphql';
if (!TOKEN) { console.error('GH_STATS_TOKEN is not set'); process.exit(1); }
const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const query = 'query($u:String!){user(login:$u){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}';
(async () => {
  const r = await fetch(API, { method: 'POST', headers: { Authorization: 'bearer ' + TOKEN, 'Content-Type': 'application/json', 'User-Agent': 'contrib-graph' }, body: JSON.stringify({ query, variables: { u: USER } }) });
  const j = await r.json();
  const cal = j && j.data && j.data.user && j.data.user.contributionsCollection.contributionCalendar;
  if (!r.ok || !cal) { console.error('GitHub error:', r.status, JSON.stringify(j).slice(0, 300)); process.exit(1); }
  const days = [];
  cal.weeks.forEach(w => w.contributionDays.forEach(d => days.push({ date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] || 0 })));
  const out = { generated: new Date().toISOString().slice(0, 10), total: { lastYear: cal.totalContributions }, contributions: days };
  fs.writeFileSync(path.join(__dirname, '..', 'contributions.json'), JSON.stringify(out));
  console.log('Saved ' + days.length + ' days, ' + cal.totalContributions + ' contributions');
})();
