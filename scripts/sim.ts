/**
 * Balance simulator.
 *   npm run sim -- --location rocky-point --rig starter --casts 10000 --at 2027-01-15T06:00Z
 * Options: --zone <id>  --seed <n>  --method bait|lure|sight  --tz <IANA zone for "device" locations>  --finder
 */
import { loadContentNode } from '../src/content/loadNode';
import { runSim } from '../src/sim/simulate';

const args = process.argv.slice(2);
const opt = (name: string, fallback?: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const { content, issues } = loadContentNode();
if (issues.errors.length) {
  console.error('Content has errors; run `npm run validate`.');
  process.exit(1);
}
if (args.includes('--help') || !opt('location')) {
  console.log('Usage: npm run sim -- --location <id> --rig <id> [--casts 10000] [--at ISO] [--zone id] [--seed n] [--method bait|lure|sight] [--tz zone]');
  console.log('Locations:', Object.values(content.locations).filter((l) => l.zones.some((z) => z.cast)).map((l) => l.id).join(', '));
  console.log('Rigs:', Object.keys(content.rigs).join(', '));
  process.exit(opt('location') ? 0 : 1);
}

const at = opt('at') ? Date.parse(opt('at')!) : Date.now();
if (Number.isNaN(at)) {
  console.error(`Cannot parse --at "${opt('at')}"`);
  process.exit(1);
}
const report = runSim(content, {
  locationId: opt('location')!, rigId: opt('rig', 'starter')!, casts: Number(opt('casts', '10000')), at,
  seed: Number(opt('seed', '1')), zoneId: opt('zone'), deviceTz: opt('tz'), method: opt('method') as never,
  finder: args.includes('--finder') ? 1 : 0,
});

const pct = (v: number) => `${(v * 100).toFixed(1)}%`.padStart(6);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
console.log(`\n${report.locationName} · ${report.rigLabel}`);
console.log(`local ${report.localTime} (${report.phase}, ${MONTHS[report.month]}${report.water ? `, ${report.water} water` : ''})${args.includes('--finder') ? ' · fish finder' : ''} · rig power ${report.power} · cast range ${report.range.toFixed(2)}\n`);
for (const z of report.zones) {
  if (!z.reachable) {
    console.log(`── ${z.zoneName}: out of casting range for this rig\n`);
    continue;
  }
  console.log(`── ${z.zoneName}: ${z.casts} casts`);
  console.log('   species                     rarity     bites   share  landed   mean cm   max cm  fight s');
  for (const r of z.rows) {
    console.log(
      `   ${r.name.padEnd(27)} ${r.rarity.padEnd(9)} ${String(r.bites).padStart(6)}  ${pct(r.bites / Math.max(1, z.fishBites))}  ${pct(r.landed / Math.max(1, r.bites))}  ${r.meanCm.toFixed(1).padStart(8)} ${r.maxCm.toFixed(1).padStart(8)} ${r.meanFightS.toFixed(1).padStart(8)}`,
    );
  }
  if (!z.rows.length) console.log('   (nothing takes this rig here at this hour)');
  const rs = z.rarityShare;
  console.log(`   rarity share of fish bites: common ${pct(rs.common)} · uncommon ${pct(rs.uncommon)} · rare ${pct(rs.rare)} · epic ${pct(rs.epic)}`);
  console.log(`   per cast: fish ${pct(z.fishBites / z.casts)} · junk ${pct(z.junk / z.casts)} · stolen ${pct(z.stolen / z.casts)} · looked and left ${pct(z.nibble / z.casts)} · nothing ${pct(z.none / z.casts)}`);
  const o = z.outcomes;
  console.log(`   outcomes: auto-land ${o.auto} · fight ${o.fight} · overmatched ${o.overmatched} · landed ${pct(z.landRate)} of hooked fish`);
  console.log(`   mean wait ${z.meanWaitS.toFixed(1)}s · mean fight ${z.meanFightS.toFixed(1)}s · mean cast-to-result ${z.meanCycleS.toFixed(1)}s`);
  console.log(`   ${z.catchesPerHour.toFixed(0)} catches/hour · ${z.coinsPerHour.toFixed(0)} coins/hour at market value\n`);
}
