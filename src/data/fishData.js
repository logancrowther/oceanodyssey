export const FISH = [
  {
    id: 'flathead',
    name: 'Flathead',
    // Typical weight for an average-sized one - individual catches roll a
    // size multiplier (see OceanScene.trySpawnFish/catchFish) that scales
    // this up or down, and value scales with the resulting weight - a
    // bigger catch is worth more, not a flat price regardless of size.
    baseWeightKg: 1.6,
    valuePerKg: 5,
    // Leftover from the old cast-and-reel minigame - kept for potential
    // future reintroduction, not read by anything right now.
    // difficultyMultiplier below IS still used, as each species' wariness -
    // see OceanScene.trySpawnFish.
    turnsRequired: 1.9,
    rarity: 'uncommon',
    difficultyMultiplier: 1.3,
    // Which equipped baits this species will actually bite (see
    // OceanScene's bait-matching check) - an ambush bottom predator, happy
    // to take either.
    baits: ['prawn', 'squid']
  },
  {
    id: 'red_morwong',
    name: 'Red Morwong',
    baseWeightKg: 1.3,
    valuePerKg: 7,
    turnsRequired: 1.8,
    rarity: 'uncommon',
    difficultyMultiplier: 1.15,
    baits: ['prawn']
  },
  {
    id: 'banded_morwong',
    name: 'Banded Morwong',
    baseWeightKg: 1.6,
    valuePerKg: 7.5,
    turnsRequired: 1.9,
    rarity: 'uncommon',
    difficultyMultiplier: 1.2,
    baits: ['prawn']
  },
  {
    id: 'blue_morwong',
    name: 'Blue Morwong',
    // The biggest and most prized of the morwong family here - real Blue
    // Morwong (Queen Snapper) run noticeably larger than their relatives.
    baseWeightKg: 2.5,
    valuePerKg: 8,
    turnsRequired: 2.1,
    rarity: 'uncommon',
    difficultyMultiplier: 1.3,
    baits: ['prawn']
  },
  {
    id: 'hairtail',
    name: 'Hairtail',
    // A fast, toothy, ribbon-bodied predator - a real scrap for something
    // this lean.
    baseWeightKg: 1.0,
    valuePerKg: 9,
    turnsRequired: 2.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.4,
    baits: ['prawn', 'squid']
  },
  {
    id: 'hapuku',
    name: 'Hapuku',
    // A big, deep-dwelling wreckfish - only turns up once the hook is
    // past 100m (see OceanScene.NORMAL_POOL/DEPTH_LIMITS), and priced as
    // the genuine deep-water prize it is.
    baseWeightKg: 18.0,
    valuePerKg: 14,
    turnsRequired: 3.0,
    rarity: 'rare',
    difficultyMultiplier: 1.9,
    baits: ['prawn', 'squid']
  },
  {
    id: 'leatherjacket',
    name: 'Leatherjacket',
    // Small, with a tiny nibbling mouth - a light catch and no fight at
    // all, but a well-known and popular eating fish.
    baseWeightKg: 0.3,
    valuePerKg: 6,
    turnsRequired: 1.1,
    rarity: 'common',
    difficultyMultiplier: 0.7,
    baits: ['prawn']
  },
  {
    id: 'longtail_tuna',
    name: 'Longtail Tuna',
    baseWeightKg: 6.0,
    valuePerKg: 10,
    turnsRequired: 2.5,
    rarity: 'rare',
    difficultyMultiplier: 1.75,
    baits: ['prawn', 'squid']
  },
  {
    id: 'yellowfin_tuna',
    name: 'Yellowfin Tuna',
    // A big, iconic gamefish - one of the most sought-after tuna there is.
    baseWeightKg: 9.0,
    valuePerKg: 13,
    turnsRequired: 2.9,
    rarity: 'rare',
    difficultyMultiplier: 1.95,
    baits: ['prawn', 'squid']
  },
  {
    id: 'southern_bluefin_tuna',
    name: 'Southern Bluefin Tuna',
    // The toughest, most prized tuna in the game - real Southern Bluefin
    // fetch the highest prices of any tuna species, and this is the
    // single hardest tuna fight here.
    baseWeightKg: 14.0,
    valuePerKg: 16,
    turnsRequired: 3.1,
    rarity: 'rare',
    difficultyMultiplier: 2.1,
    baits: ['prawn', 'squid']
  },
  {
    id: 'bigeye_tuna',
    name: 'Bigeye Tuna',
    // A deep-diving open-ocean tuna, named for its own real,
    // exceptionally large eye - adapted for hunting in the low light of
    // deeper water.
    baseWeightKg: 11.0,
    valuePerKg: 14,
    turnsRequired: 3.0,
    rarity: 'rare',
    difficultyMultiplier: 2.0,
    baits: ['prawn', 'squid']
  },
  {
    id: 'skipjack_tuna',
    name: 'Skipjack Tuna',
    // The smallest true tuna here - real skipjack school in huge numbers
    // and are the most commercially caught tuna species worldwide.
    baseWeightKg: 3.2,
    valuePerKg: 7,
    turnsRequired: 2.1,
    rarity: 'uncommon',
    difficultyMultiplier: 1.5,
    baits: ['prawn', 'squid']
  },
  {
    id: 'blackfin_tuna',
    name: 'Blackfin Tuna',
    // A small, fast tuna, easily told apart by its own dark finlets -
    // every other tuna here carries yellow ones.
    baseWeightKg: 3.8,
    valuePerKg: 8,
    turnsRequired: 2.2,
    rarity: 'uncommon',
    difficultyMultiplier: 1.55,
    baits: ['prawn', 'squid']
  },
  {
    id: 'dogtooth_tuna',
    name: 'Dogtooth Tuna',
    // Not a true tuna at all - a reef-associated relative with real,
    // large, dog-like teeth, hunted more like a trevally than a
    // schooling tuna.
    baseWeightKg: 13.0,
    valuePerKg: 15,
    turnsRequired: 3.2,
    rarity: 'rare',
    difficultyMultiplier: 2.15,
    baits: ['prawn', 'squid']
  },
  {
    id: 'luderick',
    name: 'Luderick',
    // A grazing estuary fish - real luderick feed mostly on algae, so
    // they're not remotely interested in a squid tentacle.
    baseWeightKg: 0.9,
    valuePerKg: 5,
    turnsRequired: 1.7,
    rarity: 'common',
    difficultyMultiplier: 1.05,
    baits: ['prawn']
  },
  {
    id: 'spanish_mackerel',
    name: 'Spanish Mackerel',
    // A lean, fast-swimming pelagic predator with real wavy body
    // barring, prized as one of the better table-fish mackerel.
    baseWeightKg: 5.5,
    valuePerKg: 11,
    turnsRequired: 2.5,
    rarity: 'uncommon',
    difficultyMultiplier: 1.7,
    baits: ['prawn', 'squid']
  },
  {
    id: 'school_mackerel',
    name: 'School Mackerel',
    // A smaller, blotch-marked schooling mackerel - a real common
    // inshore catch, less prized than its larger Spanish and King
    // relatives.
    baseWeightKg: 1.8,
    valuePerKg: 6,
    turnsRequired: 1.9,
    rarity: 'common',
    difficultyMultiplier: 1.25,
    baits: ['prawn', 'squid']
  },
  {
    id: 'king_mackerel',
    name: 'King Mackerel',
    // The largest, plainest-flanked mackerel here - real King Mackerel
    // (kingfish, in some regions) run big and unmarked compared to their
    // spotted and barred relatives.
    baseWeightKg: 8.5,
    valuePerKg: 12,
    turnsRequired: 2.8,
    rarity: 'uncommon',
    difficultyMultiplier: 1.85,
    baits: ['prawn', 'squid']
  },
  {
    id: 'mahi_mahi',
    name: 'Mahi Mahi',
    // A brilliantly colored open-ocean gamefish - real mahi mahi are
    // famous for both their speed and their vivid, fading iridescence.
    baseWeightKg: 7.5,
    valuePerKg: 13,
    turnsRequired: 2.6,
    rarity: 'rare',
    difficultyMultiplier: 1.9,
    baits: ['prawn', 'squid']
  },
  {
    id: 'mangrove_jack',
    name: 'Mangrove Jack',
    // A hard-fighting estuary and reef predator with real, prominent
    // canine teeth - notorious among anglers for bolting straight for
    // structure once hooked.
    baseWeightKg: 1.9,
    valuePerKg: 9,
    turnsRequired: 2.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.5,
    baits: ['prawn', 'squid']
  },
  {
    id: 'black_marlin',
    name: 'Black Marlin',
    // The stockiest, heaviest billfish here - real black marlin are
    // famous for the rigid pectoral fins they can't fold flat, and for
    // sheer brute strength on the line.
    baseWeightKg: 90.0,
    valuePerKg: 18,
    turnsRequired: 4.4,
    rarity: 'legendary',
    difficultyMultiplier: 2.9,
    baits: ['prawn', 'squid']
  },
  {
    id: 'blue_marlin',
    name: 'Blue Marlin',
    // The largest, most streamlined billfish here - a real Blue Marlin
    // is one of the biggest bony fish in the ocean and a genuine
    // bucket-list gamefish.
    baseWeightKg: 110.0,
    valuePerKg: 19,
    turnsRequired: 4.6,
    rarity: 'legendary',
    difficultyMultiplier: 3.0,
    baits: ['prawn', 'squid']
  },
  {
    id: 'striped_marlin',
    name: 'Striped Marlin',
    // Known for its dramatic sail-like dorsal fin and blistering speed -
    // real striped marlin are among the fastest fish in the ocean.
    baseWeightKg: 65.0,
    valuePerKg: 20,
    turnsRequired: 4.0,
    rarity: 'legendary',
    difficultyMultiplier: 2.65,
    baits: ['prawn', 'squid']
  },
  {
    id: 'white_marlin',
    name: 'White Marlin',
    // The smallest marlin here - still a serious gamefish, just a step
    // below its three larger relatives.
    baseWeightKg: 32.0,
    valuePerKg: 14,
    turnsRequired: 3.4,
    rarity: 'rare',
    difficultyMultiplier: 2.2,
    baits: ['prawn', 'squid']
  },
  {
    id: 'moses_perch',
    name: 'Moses Perch',
    // A small, plain reef snapper-relative, easily told apart by its
    // own real dark saddle blotch at the base of the tail.
    baseWeightKg: 0.7,
    valuePerKg: 6,
    turnsRequired: 1.6,
    rarity: 'common',
    difficultyMultiplier: 1.1,
    baits: ['prawn', 'squid']
  },
  {
    id: 'mulloway',
    name: 'Mulloway',
    // A big, prized estuary and surf gamefish - real mulloway
    // (sometimes called jewfish too, but a lighter, silvery-bronze
    // species distinct from the Black Jewfish here) are a serious
    // trophy target.
    baseWeightKg: 12.0,
    valuePerKg: 12,
    turnsRequired: 3.0,
    rarity: 'rare',
    difficultyMultiplier: 2.05,
    baits: ['prawn', 'squid']
  },
  {
    id: 'pearl_perch',
    name: 'Pearl Perch',
    // A real deepwater reef fish prized on the table - named for its
    // own pearly sheen and famously large eyes.
    baseWeightKg: 1.6,
    valuePerKg: 9,
    turnsRequired: 2.1,
    rarity: 'uncommon',
    difficultyMultiplier: 1.4,
    baits: ['prawn', 'squid']
  },
  {
    id: 'pink_snapper',
    name: 'Pink Snapper',
    // A prized Australasian table fish - real big old males grow the
    // distinctive bony forehead hump modeled here.
    baseWeightKg: 3.2,
    valuePerKg: 10,
    turnsRequired: 2.3,
    rarity: 'uncommon',
    difficultyMultiplier: 1.5,
    baits: ['prawn', 'squid']
  },
  {
    id: 'red_snapper',
    name: 'Red Snapper',
    // A vividly colored reef predator - real Red Snapper are one of
    // the most recognizable and sought-after snapper species anywhere.
    baseWeightKg: 4.5,
    valuePerKg: 11,
    turnsRequired: 2.5,
    rarity: 'uncommon',
    difficultyMultiplier: 1.6,
    baits: ['prawn', 'squid']
  },
  {
    id: 'mangrove_snapper',
    name: 'Mangrove Snapper',
    // A genuinely distinct species from the Mangrove Jack here, despite
    // the shared common name - real Mangrove Snapper are a separate,
    // more muted grey-brown reef and estuary predator.
    baseWeightKg: 1.6,
    valuePerKg: 8,
    turnsRequired: 2.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.45,
    baits: ['prawn', 'squid']
  },
  {
    id: 'vermilion_snapper',
    name: 'Vermilion Snapper',
    // A slender, bright reef snapper with unusually weak canines for the
    // family, and its own faint yellow flank streaking as the real ID
    // mark.
    baseWeightKg: 0.9,
    valuePerKg: 7,
    turnsRequired: 1.8,
    rarity: 'common',
    difficultyMultiplier: 1.15,
    baits: ['prawn', 'squid']
  },
  {
    id: 'silk_snapper',
    name: 'Silk Snapper',
    // A real deepwater reef snapper, told apart by its own bright
    // yellow eye and yellow-tinged fins over a soft pink "silk" sheen.
    baseWeightKg: 1.4,
    valuePerKg: 8,
    turnsRequired: 2.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.35,
    baits: ['prawn', 'squid']
  },
  {
    id: 'queenfish',
    name: 'Queenfish',
    // A fast, slashing pelagic predator - real queenfish are famous for
    // spectacular aerial jumps once hooked.
    baseWeightKg: 2.4,
    valuePerKg: 8,
    turnsRequired: 2.1,
    rarity: 'uncommon',
    difficultyMultiplier: 1.55,
    baits: ['prawn', 'squid']
  },
  {
    id: 'red_emperor',
    name: 'Red Emperor',
    // One of the most prized reef fish there is - real Red Emperor
    // carries the boldest, most patterned coloring of any reddish fish
    // here.
    baseWeightKg: 4.8,
    valuePerKg: 13,
    turnsRequired: 2.7,
    rarity: 'rare',
    difficultyMultiplier: 1.75,
    baits: ['prawn', 'squid']
  },
  {
    id: 'crimson_snapper',
    name: 'Crimson Snapper',
    // A deep, saturated reef snapper - a real staple of northern
    // Australian reef fishing.
    baseWeightKg: 1.5,
    valuePerKg: 8,
    turnsRequired: 2.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.35,
    baits: ['prawn', 'squid']
  },
  {
    id: 'fingermark',
    name: 'Fingermark',
    // Named for its own real "thumbprint" flank blotch - a hard-
    // fighting golden-bronze reef and estuary predator.
    baseWeightKg: 2.2,
    valuePerKg: 9,
    turnsRequired: 2.2,
    rarity: 'uncommon',
    difficultyMultiplier: 1.5,
    baits: ['prawn', 'squid']
  },
  {
    id: 'nannygai',
    name: 'Nannygai',
    // A real deepwater beryx relative, not a snapper at all - prized on
    // the table, with famously huge eyes for hunting in dim water.
    baseWeightKg: 1.1,
    valuePerKg: 7,
    turnsRequired: 1.9,
    rarity: 'common',
    difficultyMultiplier: 1.2,
    baits: ['prawn', 'squid']
  },
  {
    id: 'sailfish',
    name: 'Sailfish',
    // The fastest fish in the ocean - the single hardest, fastest fight
    // in the game, and the most spectacular sail-fin silhouette here.
    baseWeightKg: 38.0,
    valuePerKg: 19,
    turnsRequired: 4.2,
    rarity: 'legendary',
    difficultyMultiplier: 2.85,
    baits: ['prawn', 'squid']
  },
  {
    id: 'samsonfish',
    name: 'Samsonfish',
    // A bulkier, bronzier real relative of the Kingfish and Amberjack -
    // a tough, hard-pulling southern gamefish in its own right.
    baseWeightKg: 9.5,
    valuePerKg: 10,
    turnsRequired: 2.9,
    rarity: 'rare',
    difficultyMultiplier: 1.95,
    baits: ['prawn', 'squid']
  },
  {
    id: 'sand_whiting',
    name: 'Sand Whiting',
    // A classic, widespread estuary and beach species - a real angling
    // staple.
    baseWeightKg: 0.35,
    valuePerKg: 6,
    turnsRequired: 1.3,
    rarity: 'common',
    difficultyMultiplier: 0.85,
    baits: ['prawn']
  },
  {
    id: 'school_whiting',
    name: 'School Whiting',
    // A small, plain, schooling whiting - real school whiting turn up
    // in huge numbers over sand and mud flats.
    baseWeightKg: 0.15,
    valuePerKg: 4,
    turnsRequired: 1.1,
    rarity: 'common',
    difficultyMultiplier: 0.6,
    baits: ['prawn']
  },
  {
    id: 'king_george_whiting',
    name: 'King George Whiting',
    // The largest, most prized whiting there is - a real premium table
    // fish across southern Australian waters.
    baseWeightKg: 0.55,
    valuePerKg: 9,
    turnsRequired: 1.6,
    rarity: 'uncommon',
    difficultyMultiplier: 1.05,
    baits: ['prawn']
  },
  {
    id: 'yellowfin_whiting',
    name: 'Yellowfin Whiting',
    // A pale, plain-bodied whiting best told apart by its own real
    // yellow-tinged fins.
    baseWeightKg: 0.25,
    valuePerKg: 5,
    turnsRequired: 1.2,
    rarity: 'common',
    difficultyMultiplier: 0.7,
    baits: ['prawn']
  },
  {
    id: 'trumpeter_whiting',
    name: 'Trumpeter Whiting',
    // Named for its own real elongated, tubular snout - a common
    // estuary and inshore catch.
    baseWeightKg: 0.3,
    valuePerKg: 5,
    turnsRequired: 1.25,
    rarity: 'common',
    difficultyMultiplier: 0.75,
    baits: ['prawn']
  },
  {
    id: 'snook',
    name: 'Snook',
    // A genuinely distinct species from the Barramundi here, despite the
    // similar predatory build - real snook are famous light-tackle
    // gamefish, prized for their speed and aerial jumps.
    baseWeightKg: 3.5,
    valuePerKg: 9,
    turnsRequired: 2.2,
    rarity: 'uncommon',
    difficultyMultiplier: 1.55,
    baits: ['prawn', 'squid']
  },
  {
    id: 'teraglin',
    name: 'Teraglin',
    // A real, slender jewfish relative, distinct from both the Mulloway
    // and Black Jewfish here - a prized, harder-to-find table fish.
    baseWeightKg: 2.6,
    valuePerKg: 10,
    turnsRequired: 2.1,
    rarity: 'uncommon',
    difficultyMultiplier: 1.5,
    baits: ['prawn', 'squid']
  },
  {
    id: 'wahoo',
    name: 'Wahoo',
    // One of the fastest fish in the ocean, and a serious open-water
    // gamefish - a real Wahoo strike is famous for its blistering,
    // line-stripping run.
    baseWeightKg: 22.0,
    valuePerKg: 15,
    turnsRequired: 3.6,
    rarity: 'rare',
    difficultyMultiplier: 2.3,
    baits: ['prawn', 'squid']
  },
  {
    id: 'dhufish',
    name: 'Dhufish',
    // An iconic West Australian reef fish, famous for its own real
    // trailing dorsal-spine filaments - a genuine trophy target.
    baseWeightKg: 5.5,
    valuePerKg: 13,
    turnsRequired: 2.7,
    rarity: 'rare',
    difficultyMultiplier: 1.85,
    baits: ['prawn', 'squid']
  },
  {
    id: 'baldchin_groper',
    name: 'Baldchin Groper',
    // A large, hard-pulling wrasse named for its own real pale chin
    // patch - not a true grouper despite the name.
    baseWeightKg: 3.4,
    valuePerKg: 10,
    turnsRequired: 2.2,
    rarity: 'uncommon',
    difficultyMultiplier: 1.55,
    baits: ['prawn', 'squid']
  },
  {
    id: 'tuskfish',
    name: 'Tuskfish',
    // Named for its own real, permanently visible tusk-like teeth - a
    // tough, crustacean-crunching reef wrasse.
    baseWeightKg: 1.4,
    valuePerKg: 7,
    turnsRequired: 1.9,
    rarity: 'common',
    difficultyMultiplier: 1.2,
    baits: ['prawn']
  },
  {
    id: 'blackspot_tuskfish',
    name: 'Blackspot Tuskfish',
    // A close real relative of the plain Tuskfish here, told apart by
    // its own dark tail-base blotch.
    baseWeightKg: 2.1,
    valuePerKg: 8,
    turnsRequired: 2.1,
    rarity: 'uncommon',
    difficultyMultiplier: 1.35,
    baits: ['prawn']
  },
  {
    id: 'blue_tuskfish',
    name: 'Blue Tuskfish',
    // The most vividly colored of the tuskfish here - a real deep blue-
    // green reef wrasse.
    baseWeightKg: 1.8,
    valuePerKg: 8,
    turnsRequired: 2.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.3,
    baits: ['prawn']
  },
  {
    id: 'black_sea_bass',
    name: 'Black Sea Bass',
    // A real Atlantic grouper relative, told apart by its own white-
    // tipped dorsal spines - a popular light-tackle table fish.
    baseWeightKg: 1.2,
    valuePerKg: 7,
    turnsRequired: 1.8,
    rarity: 'common',
    difficultyMultiplier: 1.15,
    baits: ['prawn', 'squid']
  },
  {
    id: 'gag_grouper',
    name: 'Gag Grouper',
    // A real elongated grouper with its own wavy vermiculated pattern -
    // a serious reef gamefish known for diving for structure once
    // hooked.
    baseWeightKg: 6.5,
    valuePerKg: 11,
    turnsRequired: 2.6,
    rarity: 'rare',
    difficultyMultiplier: 1.7,
    baits: ['prawn', 'squid']
  },
  {
    id: 'red_grouper',
    name: 'Red Grouper',
    // A real reddish-brown mottled grouper, told apart by its own round
    // tail and black-edged pectoral fin.
    baseWeightKg: 5.0,
    valuePerKg: 10,
    turnsRequired: 2.4,
    rarity: 'uncommon',
    difficultyMultiplier: 1.6,
    baits: ['prawn', 'squid']
  },
  {
    id: 'black_grouper',
    name: 'Black Grouper',
    // A real, close relative of the Gag Grouper here, told apart by its
    // own much darker coloring and chain-like head blotches - a serious
    // Atlantic reef gamefish.
    baseWeightKg: 8.5,
    valuePerKg: 12,
    turnsRequired: 2.8,
    rarity: 'rare',
    difficultyMultiplier: 1.9,
    baits: ['prawn', 'squid']
  },
  {
    id: 'scamp',
    name: 'Scamp',
    // Another real Mycteroperca relative in this cluster, famous for the
    // real trailing tail-fin filaments adults grow.
    baseWeightKg: 3.0,
    valuePerKg: 10,
    turnsRequired: 2.2,
    rarity: 'uncommon',
    difficultyMultiplier: 1.5,
    baits: ['prawn', 'squid']
  },
  {
    id: 'warsaw_grouper',
    name: 'Warsaw Grouper',
    // One of the largest groupers there is - a real deep-water giant,
    // and a serious trophy target given how rarely one is even hooked.
    baseWeightKg: 45.0,
    valuePerKg: 17,
    turnsRequired: 3.9,
    rarity: 'legendary',
    difficultyMultiplier: 2.6,
    baits: ['prawn', 'squid']
  },
  {
    id: 'red_drum',
    name: 'Red Drum',
    // Famous for its own real tail eyespot - a hugely popular inshore
    // and estuary gamefish.
    baseWeightKg: 4.2,
    valuePerKg: 10,
    turnsRequired: 2.3,
    rarity: 'uncommon',
    difficultyMultiplier: 1.6,
    baits: ['prawn', 'squid']
  },
  {
    id: 'black_drum',
    name: 'Black Drum',
    // A real deep-bodied croaker relative, told apart by its own
    // whisker-like chin barbels used to feel for shellfish in the mud.
    baseWeightKg: 6.0,
    valuePerKg: 9,
    turnsRequired: 2.4,
    rarity: 'uncommon',
    difficultyMultiplier: 1.55,
    baits: ['prawn', 'squid']
  },
  {
    id: 'spotted_seatrout',
    name: 'Spotted Seatrout',
    // A real "trout" of the drum family, not a true trout - a hugely
    // popular light-tackle inshore catch.
    baseWeightKg: 1.3,
    valuePerKg: 8,
    turnsRequired: 1.9,
    rarity: 'common',
    difficultyMultiplier: 1.25,
    baits: ['prawn', 'squid']
  },
  {
    id: 'weakfish',
    name: 'Weakfish',
    // A close real relative of the Spotted Seatrout here - named for its
    // own real delicate, easily-torn mouth tissue.
    baseWeightKg: 1.8,
    valuePerKg: 8,
    turnsRequired: 2.0,
    rarity: 'common',
    difficultyMultiplier: 1.3,
    baits: ['prawn', 'squid']
  },
  {
    id: 'tarpon',
    name: 'Tarpon',
    // A legendary silver gamefish, famous for its spectacular aerial
    // jumps once hooked - one of the most iconic catches there is.
    baseWeightKg: 40.0,
    valuePerKg: 14,
    turnsRequired: 3.7,
    rarity: 'legendary',
    difficultyMultiplier: 2.4,
    baits: ['prawn', 'squid']
  },
  {
    id: 'bonefish',
    name: 'Bonefish',
    // An iconic flats gamefish, prized for its blistering speed - real
    // bonefish grub crustaceans out of the sand, never taking a squid
    // strip.
    baseWeightKg: 2.2,
    valuePerKg: 9,
    turnsRequired: 2.1,
    rarity: 'uncommon',
    difficultyMultiplier: 1.5,
    baits: ['prawn']
  },
  {
    id: 'permit',
    name: 'Permit',
    // Another iconic flats gamefish - real permit are famous for
    // feeding almost exclusively on crabs, so a squid strip never gets
    // a look.
    baseWeightKg: 8.0,
    valuePerKg: 13,
    turnsRequired: 2.7,
    rarity: 'rare',
    difficultyMultiplier: 1.8,
    baits: ['prawn']
  },
  {
    id: 'striped_bass',
    name: 'Striped Bass',
    // A real iconic Atlantic gamefish, famous for its own real body-
    // length horizontal stripes.
    baseWeightKg: 5.5,
    valuePerKg: 11,
    turnsRequired: 2.5,
    rarity: 'uncommon',
    difficultyMultiplier: 1.65,
    baits: ['prawn', 'squid']
  },
  {
    id: 'sheepshead',
    name: 'Sheepshead',
    // Named for its own real flat, human-like teeth - a notoriously
    // bait-stealing structure fish.
    baseWeightKg: 2.0,
    valuePerKg: 8,
    turnsRequired: 2.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.35,
    baits: ['prawn']
  },
  {
    id: 'hogfish',
    name: 'Hogfish',
    // Named for its own real pig-like snout, used to root crustaceans
    // out of rubble - a prized reef table fish.
    baseWeightKg: 2.6,
    valuePerKg: 11,
    turnsRequired: 2.2,
    rarity: 'uncommon',
    difficultyMultiplier: 1.5,
    baits: ['prawn']
  },
  {
    id: 'florida_pompano',
    name: 'Florida Pompano',
    // A real, smaller relative of the Permit here - one of the most
    // prized table fish on the flats.
    baseWeightKg: 1.1,
    valuePerKg: 10,
    turnsRequired: 1.9,
    rarity: 'common',
    difficultyMultiplier: 1.2,
    baits: ['prawn']
  },
  {
    id: 'crevalle_jack',
    name: 'Crevalle Jack',
    // A real hard-pulling inshore jack, told apart by its own two black
    // spots - notorious for a stubborn, circling fight.
    baseWeightKg: 4.0,
    valuePerKg: 7,
    turnsRequired: 2.2,
    rarity: 'common',
    difficultyMultiplier: 1.5,
    baits: ['prawn', 'squid']
  },
  {
    id: 'ladyfish',
    name: 'Ladyfish',
    // A real small, slender Tarpon relative, prized for its own acrobatic
    // jumps despite its modest size.
    baseWeightKg: 0.8,
    valuePerKg: 5,
    turnsRequired: 1.6,
    rarity: 'common',
    difficultyMultiplier: 1.1,
    baits: ['prawn', 'squid']
  },
  {
    id: 'tripletail',
    name: 'Tripletail',
    // Named for its own real rounded dorsal, anal, and tail fins, which
    // give it the look of three separate tails - a real ambush predator
    // that drifts near surface debris.
    baseWeightKg: 3.5,
    valuePerKg: 10,
    turnsRequired: 2.3,
    rarity: 'uncommon',
    difficultyMultiplier: 1.55,
    baits: ['prawn', 'squid']
  },
  {
    id: 'atlantic_croaker',
    name: 'Atlantic Croaker',
    // A real small drum-family fish, named for the croaking sound it
    // makes - a common, easygoing inshore catch.
    baseWeightKg: 0.4,
    valuePerKg: 4,
    turnsRequired: 1.2,
    rarity: 'common',
    difficultyMultiplier: 0.75,
    baits: ['prawn']
  },
  {
    id: 'spot',
    name: 'Spot',
    // Named for its own real single shoulder spot - a small, common,
    // easy inshore catch.
    baseWeightKg: 0.2,
    valuePerKg: 4,
    turnsRequired: 1.0,
    rarity: 'common',
    difficultyMultiplier: 0.6,
    baits: ['prawn']
  },
  {
    id: 'pigfish',
    name: 'Pigfish',
    // A real grunt-family fish, named for the pig-like grunting sound it
    // makes - a common and popular live-bait species in its own right.
    baseWeightKg: 0.35,
    valuePerKg: 4,
    turnsRequired: 1.15,
    rarity: 'common',
    difficultyMultiplier: 0.7,
    baits: ['prawn']
  },
  {
    id: 'white_grunt',
    name: 'White Grunt',
    // A real grunt-family fish, named for the same grinding "grunt" the
    // Pigfish makes - told apart by its own bright orange-red mouth
    // interior.
    baseWeightKg: 0.6,
    valuePerKg: 5,
    turnsRequired: 1.4,
    rarity: 'common',
    difficultyMultiplier: 0.9,
    baits: ['prawn']
  },
  {
    id: 'red_porgy',
    name: 'Red Porgy',
    // A real sparid, prized on the table - told apart by its own fine
    // pale-blue scale speckling over a reddish-pink body.
    baseWeightKg: 1.5,
    valuePerKg: 8,
    turnsRequired: 1.9,
    rarity: 'uncommon',
    difficultyMultiplier: 1.3,
    baits: ['prawn']
  },
  {
    id: 'scup',
    name: 'Scup',
    // A real small, compact porgy relative - a common, easygoing
    // Atlantic inshore catch.
    baseWeightKg: 0.4,
    valuePerKg: 5,
    turnsRequired: 1.2,
    rarity: 'common',
    difficultyMultiplier: 0.8,
    baits: ['prawn']
  },
  {
    id: 'tautog',
    name: 'Tautog',
    // A real chunky blackfish wrasse, prized for its tough fight and
    // its liking for structure and wrecks.
    baseWeightKg: 2.2,
    valuePerKg: 8,
    turnsRequired: 2.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.4,
    baits: ['prawn']
  },
  {
    id: 'golden_tilefish',
    name: 'Golden Tilefish',
    // A real deep-water tilefish, famous for its own fleshy head crest -
    // a genuine deep-drop trophy target.
    baseWeightKg: 6.5,
    valuePerKg: 13,
    turnsRequired: 2.8,
    rarity: 'rare',
    difficultyMultiplier: 1.85,
    baits: ['prawn', 'squid']
  },
  {
    id: 'blueline_tilefish',
    name: 'Blueline Tilefish',
    // A real, different-genus deep-water tilefish relative of the Golden
    // Tilefish here - a popular deep-drop table fish.
    baseWeightKg: 2.4,
    valuePerKg: 10,
    turnsRequired: 2.2,
    rarity: 'uncommon',
    difficultyMultiplier: 1.5,
    baits: ['prawn', 'squid']
  },
  {
    id: 'atlantic_mackerel',
    name: 'Atlantic Mackerel',
    // A real, different-genus mackerel from the Spanish/School/King
    // Mackerel here - schools in huge numbers, a classic baitfish and
    // table fish both.
    baseWeightKg: 0.5,
    valuePerKg: 5,
    turnsRequired: 1.4,
    rarity: 'common',
    difficultyMultiplier: 0.95,
    baits: ['prawn', 'squid']
  },
  {
    id: 'cero_mackerel',
    name: 'Cero Mackerel',
    // A real close relative of the Spanish Mackerel here, told apart by
    // its own bronze lateral stripe and spot rows.
    baseWeightKg: 2.8,
    valuePerKg: 9,
    turnsRequired: 2.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.4,
    baits: ['prawn', 'squid']
  },
  {
    id: 'little_tunny',
    name: 'Little Tunny',
    // A real small tuna, also known as "false albacore" - a
    // surprisingly hard, fast fighter for its size.
    baseWeightKg: 2.6,
    valuePerKg: 7,
    turnsRequired: 1.95,
    rarity: 'common',
    difficultyMultiplier: 1.4,
    baits: ['prawn', 'squid']
  },
  {
    id: 'atlantic_bonito',
    name: 'Atlantic Bonito',
    // A real, leaner-bodied Sarda relative of the Bonito here - a fast,
    // hard-fighting schooling predator.
    baseWeightKg: 2.2,
    valuePerKg: 7,
    turnsRequired: 1.9,
    rarity: 'common',
    difficultyMultiplier: 1.35,
    baits: ['prawn', 'squid']
  },
  {
    id: 'shortfin_mako',
    name: 'Shortfin Mako',
    // Not in the normal spawn pool at all - like every shark below, it
    // only has a chance to appear when fishing with one of its own
    // realistic prey species as bait (see OceanScene.SHARK_BAIT). The
    // fastest shark there is - a real bucket-list gamefish, famous for
    // spectacular leaps once hooked.
    baseWeightKg: 60.0,
    valuePerKg: 16,
    turnsRequired: 3.6,
    rarity: 'legendary',
    difficultyMultiplier: 2.5
  },
  {
    id: 'whaler_shark',
    name: 'Whaler Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a deliberately plain, unmarked requiem shark, the real catch-all
    // name Australian anglers use for an unidentified Carcharhinus shark.
    baseWeightKg: 38.0,
    valuePerKg: 9,
    turnsRequired: 2.9,
    rarity: 'uncommon',
    difficultyMultiplier: 1.85
  },
  {
    id: 'bronze_whaler',
    name: 'Bronze Whaler',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a real, close relative of the Whaler here, told apart by its own
    // copper-bronze sheen - a hard-fighting inshore predator.
    baseWeightKg: 45.0,
    valuePerKg: 10,
    turnsRequired: 3.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.95
  },
  {
    id: 'dusky_shark',
    name: 'Dusky Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a real, big, long-lived requiem shark, told apart by its own
    // interdorsal ridge - a serious, powerful fight.
    baseWeightKg: 90.0,
    valuePerKg: 12,
    turnsRequired: 3.3,
    rarity: 'rare',
    difficultyMultiplier: 2.15
  },
  {
    id: 'blacktip_shark',
    name: 'Blacktip Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // named for its own real bold black fin tips - a fast, acrobatic
    // inshore shark famous for spinning leaps.
    baseWeightKg: 35.0,
    valuePerKg: 9,
    turnsRequired: 2.8,
    rarity: 'uncommon',
    difficultyMultiplier: 1.8
  },
  {
    id: 'spinner_shark',
    name: 'Spinner Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a real close look-alike of the Blacktip Shark here, told apart by
    // its own black-tipped anal fin - also a famous acrobatic jumper.
    baseWeightKg: 40.0,
    valuePerKg: 9,
    turnsRequired: 2.85,
    rarity: 'uncommon',
    difficultyMultiplier: 1.85
  },
  {
    id: 'hammerhead',
    name: 'Hammerhead',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // the plain baseline hammerhead here - a real, genuinely bizarre
    // silhouette even before any of its more extreme named relatives.
    baseWeightKg: 50.0,
    valuePerKg: 11,
    turnsRequired: 3.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.95
  },
  {
    id: 'scalloped_hammerhead',
    name: 'Scalloped Hammerhead',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // told apart from the plain Hammerhead by its own scalloped hammer
    // margin - a real schooling hammerhead species.
    baseWeightKg: 58.0,
    valuePerKg: 12,
    turnsRequired: 3.15,
    rarity: 'rare',
    difficultyMultiplier: 2.05
  },
  {
    id: 'great_hammerhead',
    name: 'Great Hammerhead',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // the largest hammerhead there is - a genuine trophy target and one
    // of the toughest fights among the new sharks here.
    baseWeightKg: 130.0,
    valuePerKg: 14,
    turnsRequired: 3.5,
    rarity: 'legendary',
    difficultyMultiplier: 2.35
  },
  {
    id: 'wobbegong',
    name: 'Wobbegong',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a real flat, camouflaged carpet shark - a bizarre-looking bottom
    // ambush predator, mostly harmless to anglers.
    baseWeightKg: 15.0,
    valuePerKg: 6,
    turnsRequired: 2.0,
    rarity: 'common',
    difficultyMultiplier: 1.2
  },
  {
    id: 'ornate_wobbegong',
    name: 'Ornate Wobbegong',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a real close relative of the Wobbegong here, told apart by its own
    // bold, geometric rosette pattern.
    baseWeightKg: 18.0,
    valuePerKg: 6,
    turnsRequired: 2.1,
    rarity: 'uncommon',
    difficultyMultiplier: 1.3
  },
  {
    id: 'spotted_wobbegong',
    name: 'Spotted Wobbegong',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // another real close relative, told apart by its own dense small
    // spotting pattern.
    baseWeightKg: 20.0,
    valuePerKg: 6,
    turnsRequired: 2.15,
    rarity: 'uncommon',
    difficultyMultiplier: 1.35
  },
  {
    id: 'gummy_shark',
    name: 'Gummy Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a real, harmless houndshark - named for its own flat, plate-like
    // grinding teeth, and a real staple of "fish and chips" in
    // Australia.
    baseWeightKg: 12.0,
    valuePerKg: 7,
    turnsRequired: 1.8,
    rarity: 'common',
    difficultyMultiplier: 1.1
  },
  {
    id: 'school_shark',
    name: 'School Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a real houndshark, prized as a table fish - told apart from the
    // Gummy Shark by its own long, slender, pointed snout.
    baseWeightKg: 25.0,
    valuePerKg: 8,
    turnsRequired: 2.3,
    rarity: 'common',
    difficultyMultiplier: 1.5
  },
  {
    id: 'blue_shark',
    name: 'Blue Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a real, sleek pelagic shark, famous for the most vivid blue
    // coloring of any shark there is.
    baseWeightKg: 55.0,
    valuePerKg: 10,
    turnsRequired: 2.9,
    rarity: 'rare',
    difficultyMultiplier: 1.9
  },
  {
    id: 'spiny_dogfish',
    name: 'Spiny Dogfish',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a real small shark, named for the venomous spine in front of each
    // dorsal fin - handle with care.
    baseWeightKg: 4.0,
    valuePerKg: 5,
    turnsRequired: 1.4,
    rarity: 'common',
    difficultyMultiplier: 0.9
  },
  {
    id: 'smooth_dogfish',
    name: 'Smooth Dogfish',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a real, close relative of the Spiny Dogfish here, told apart by
    // having no spines at all, and a proper anal fin.
    baseWeightKg: 3.5,
    valuePerKg: 5,
    turnsRequired: 1.35,
    rarity: 'common',
    difficultyMultiplier: 0.85
  },
  {
    id: 'seven_gilled_shark',
    name: 'Seven Gilled Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a real, ancient primitive shark lineage - named for its own seven
    // gill slits, one more than every other shark here.
    baseWeightKg: 60.0,
    valuePerKg: 12,
    turnsRequired: 3.1,
    rarity: 'rare',
    difficultyMultiplier: 2.1
  },
  {
    id: 'six_gilled_shark',
    name: 'Six Gilled Shark',
    // Also only reachable via the right bait, and even deeper than the
    // shared shark minimum (see OceanScene.SHARK_BAIT) - a real, ancient
    // deep-water giant, one of the largest and oldest shark lineages
    // there is.
    baseWeightKg: 150.0,
    valuePerKg: 15,
    turnsRequired: 3.6,
    rarity: 'legendary',
    difficultyMultiplier: 2.4
  },
  {
    id: 'sawshark',
    name: 'Sawshark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // named for its own real blade-like toothed saw rostrum - one of the
    // strangest, most recognizable heads of any fish there is.
    baseWeightKg: 15.0,
    valuePerKg: 8,
    turnsRequired: 2.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.3
  },
  {
    id: 'thresher_shark',
    name: 'Thresher Shark',
    // Only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // famous for its own real, massively elongated tail, used to whip
    // and stun schooling baitfish - a genuine trophy target.
    baseWeightKg: 75.0,
    valuePerKg: 14,
    turnsRequired: 3.4,
    rarity: 'legendary',
    difficultyMultiplier: 2.3
  },
  {
    id: 'angel_shark',
    name: 'Angel Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a real flat, ray-like ambush predator that buries itself in sand,
    // easily missed until it strikes.
    baseWeightKg: 16.0,
    valuePerKg: 7,
    turnsRequired: 1.9,
    rarity: 'uncommon',
    difficultyMultiplier: 1.25
  },
  {
    id: 'nurse_shark',
    name: 'Nurse Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a real docile, sluggish bottom-dweller, named for its own whisker-
    // like snout barbels.
    baseWeightKg: 40.0,
    valuePerKg: 6,
    turnsRequired: 2.0,
    rarity: 'common',
    difficultyMultiplier: 1.1
  },
  {
    id: 'lemon_shark',
    name: 'Lemon Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // named for its own real pale yellow coloring - a real popular
    // shallow-water research and dive species.
    baseWeightKg: 45.0,
    valuePerKg: 9,
    turnsRequired: 2.7,
    rarity: 'rare',
    difficultyMultiplier: 1.75
  },
  {
    id: 'sandbar_shark',
    name: 'Sandbar Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // named for its own real exceptionally tall first dorsal fin - a
    // common, stocky coastal requiem shark.
    baseWeightKg: 50.0,
    valuePerKg: 9,
    turnsRequired: 2.9,
    rarity: 'uncommon',
    difficultyMultiplier: 1.9
  },
  {
    id: 'blacktip_reef_shark',
    name: 'Blacktip Reef Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // a genuinely distinct, smaller real species from the Blacktip Shark
    // here, common on shallow reef flats.
    baseWeightKg: 15.0,
    valuePerKg: 7,
    turnsRequired: 1.85,
    rarity: 'common',
    difficultyMultiplier: 1.2
  },
  {
    id: 'guitarfish',
    name: 'Guitarfish',
    // Only reachable via squid bait, rarely prawn (see
    // OceanScene.RAY_BAIT) - a real shark-tailed ray, unlike the whip-
    // tailed rays here.
    baseWeightKg: 8.0,
    valuePerKg: 5,
    turnsRequired: 1.8,
    rarity: 'uncommon',
    difficultyMultiplier: 1.3
  },
  {
    id: 'shovelnose_ray',
    name: 'Shovelnose Ray',
    // Also only reachable via squid bait, rarely prawn (see
    // OceanScene.RAY_BAIT) - a real, genuinely distinct relative of the
    // Guitarfish here, told apart by its own broad shovel snout.
    baseWeightKg: 9.0,
    valuePerKg: 5,
    turnsRequired: 1.85,
    rarity: 'uncommon',
    difficultyMultiplier: 1.35
  },
  {
    id: 'eagle_ray',
    name: 'Eagle Ray',
    // Also only reachable via squid bait, rarely prawn (see
    // OceanScene.RAY_BAIT) - a real, striking spotted ray with its own
    // distinct duck-bill head.
    baseWeightKg: 15.0,
    valuePerKg: 7,
    turnsRequired: 2.3,
    rarity: 'rare',
    difficultyMultiplier: 1.75
  },
  {
    id: 'manta_ray',
    name: 'Manta Ray',
    // Also only reachable via squid bait, rarely prawn (see
    // OceanScene.RAY_BAIT) - the largest ray there is, and a genuine
    // trophy encounter.
    baseWeightKg: 400.0,
    valuePerKg: 12,
    turnsRequired: 3.8,
    rarity: 'legendary',
    difficultyMultiplier: 2.6
  },
  {
    id: 'devil_ray',
    name: 'Devil Ray',
    // Also only reachable via squid bait, rarely prawn (see
    // OceanScene.RAY_BAIT) - a real, smaller relative of the Manta here,
    // told apart by its own horn-like cephalic fins.
    baseWeightKg: 60.0,
    valuePerKg: 9,
    turnsRequired: 2.9,
    rarity: 'rare',
    difficultyMultiplier: 2.1
  },
  {
    id: 'stingray',
    name: 'Stingray',
    // Also only reachable via squid bait, rarely prawn (see
    // OceanScene.RAY_BAIT) - a deliberately plain, common baseline ray.
    baseWeightKg: 5.0,
    valuePerKg: 4,
    turnsRequired: 1.4,
    rarity: 'common',
    difficultyMultiplier: 1.0
  },
  {
    id: 'southern_stingray',
    name: 'Southern Stingray',
    // Also only reachable via squid bait, rarely prawn (see
    // OceanScene.RAY_BAIT) - a real, genuinely distinct species from the
    // plain Stingray here, told apart by its own angular diamond disc.
    baseWeightKg: 12.0,
    valuePerKg: 5,
    turnsRequired: 1.9,
    rarity: 'uncommon',
    difficultyMultiplier: 1.4
  },
  {
    id: 'cownose_ray',
    name: 'Cownose Ray',
    // Also only reachable via squid bait, rarely prawn (see
    // OceanScene.RAY_BAIT) - named for its own real bilobed "cow nose"
    // snout.
    baseWeightKg: 4.0,
    valuePerKg: 4,
    turnsRequired: 1.35,
    rarity: 'common',
    difficultyMultiplier: 1.05
  },
  {
    id: 'butterfly_ray',
    name: 'Butterfly Ray',
    // Also only reachable via squid bait, rarely prawn (see
    // OceanScene.RAY_BAIT) - named for its own real extremely wide,
    // short-tailed silhouette.
    baseWeightKg: 6.0,
    valuePerKg: 4,
    turnsRequired: 1.4,
    rarity: 'common',
    difficultyMultiplier: 1.0
  },
  {
    id: 'electric_ray',
    name: 'Electric Ray',
    // Also only reachable via squid bait, rarely prawn (see
    // OceanScene.RAY_BAIT) - a real ray with its own genuine electric
    // organs - handle with care.
    baseWeightKg: 8.0,
    valuePerKg: 6,
    turnsRequired: 1.9,
    rarity: 'uncommon',
    difficultyMultiplier: 1.5
  },
  {
    id: 'torpedo_ray',
    name: 'Torpedo Ray',
    // Also only reachable via squid bait, rarely prawn (see
    // OceanScene.RAY_BAIT) - looks like the plain Stingray (see
    // tackle.js) but a genuinely faster swimmer.
    baseWeightKg: 20.0,
    valuePerKg: 8,
    turnsRequired: 2.4,
    rarity: 'rare',
    difficultyMultiplier: 1.8
  },
  {
    id: 'banjo_ray',
    name: 'Banjo Ray',
    // Also only reachable via squid bait, rarely prawn (see
    // OceanScene.RAY_BAIT) - a real, small, rounded-disc relative of the
    // Guitarfish family.
    baseWeightKg: 3.0,
    valuePerKg: 4,
    turnsRequired: 1.25,
    rarity: 'common',
    difficultyMultiplier: 0.95
  },
  {
    id: 'fiddler_ray',
    name: 'Fiddler Ray',
    // Also only reachable via squid bait, rarely prawn (see
    // OceanScene.RAY_BAIT) - a real, close relative of the Banjo Ray
    // here, told apart by its own bold saddle bands.
    baseWeightKg: 3.5,
    valuePerKg: 4,
    turnsRequired: 1.3,
    rarity: 'common',
    difficultyMultiplier: 1.0
  },
  {
    id: 'barndoor_skate',
    name: 'Barndoor Skate',
    // The largest real skate there is - a genuine trophy bottom-dweller,
    // told apart from the rays by carrying no tail spine at all.
    baseWeightKg: 15.0,
    valuePerKg: 4,
    turnsRequired: 2.1,
    rarity: 'uncommon',
    difficultyMultiplier: 1.4,
    baits: ['prawn', 'squid']
  },
  {
    id: 'winter_skate',
    name: 'Winter Skate',
    // A real, close relative of the Barndoor Skate here, told apart by
    // its own eyespot-like pectoral blotches.
    baseWeightKg: 5.0,
    valuePerKg: 3,
    turnsRequired: 1.5,
    rarity: 'common',
    difficultyMultiplier: 1.0,
    baits: ['prawn', 'squid']
  },
  {
    id: 'clearnose_skate',
    name: 'Clearnose Skate',
    // Named for its own real translucent snout patches - a common,
    // easily recognized inshore skate.
    baseWeightKg: 3.0,
    valuePerKg: 3,
    turnsRequired: 1.3,
    rarity: 'common',
    difficultyMultiplier: 0.9,
    baits: ['prawn', 'squid']
  },
  {
    id: 'little_skate',
    name: 'Little Skate',
    // The smallest skate here - a real, common, unremarkable inshore
    // catch.
    baseWeightKg: 1.0,
    valuePerKg: 3,
    turnsRequired: 1.0,
    rarity: 'common',
    difficultyMultiplier: 0.6,
    baits: ['prawn', 'squid']
  },
  {
    id: 'great_barracuda',
    name: 'Great Barracuda',
    // The largest barracuda there is - a real fierce open-water
    // predator and a serious gamefish.
    baseWeightKg: 12.0,
    valuePerKg: 8,
    turnsRequired: 2.6,
    rarity: 'rare',
    difficultyMultiplier: 1.7,
    baits: ['prawn', 'squid']
  },
  {
    id: 'pickhandle_barracuda',
    name: 'Pickhandle Barracuda',
    // A real, smaller, more slender relative of the Great Barracuda
    // here.
    baseWeightKg: 3.0,
    valuePerKg: 6,
    turnsRequired: 1.7,
    rarity: 'uncommon',
    difficultyMultiplier: 1.2,
    baits: ['prawn', 'squid']
  },
  {
    id: 'fat_snook',
    name: 'Fat Snook',
    // A real, genuinely distinct, stockier relative of the Snook here.
    baseWeightKg: 3.0,
    valuePerKg: 8,
    turnsRequired: 2.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.4,
    baits: ['prawn', 'squid']
  },
  {
    id: 'african_pompano',
    name: 'African Pompano',
    // A real, deep-bodied trevally relative, famous for its own
    // trailing fin filaments.
    baseWeightKg: 6.0,
    valuePerKg: 9,
    turnsRequired: 2.2,
    rarity: 'uncommon',
    difficultyMultiplier: 1.55,
    baits: ['prawn', 'squid']
  },
  {
    id: 'lookdown',
    name: 'Lookdown',
    // A real, tiny-mouthed, paper-thin baitfish - real lookdown bait is
    // small strips/prawns, never a tough squid strip.
    baseWeightKg: 0.4,
    valuePerKg: 5,
    turnsRequired: 1.1,
    rarity: 'common',
    difficultyMultiplier: 0.7,
    baits: ['prawn']
  },
  {
    id: 'southern_flounder',
    name: 'Southern Flounder',
    // A big, big-mouthed flatfish - a real ambush predator among
    // flatfish, not just a passive bottom-hugger.
    baseWeightKg: 1.2,
    valuePerKg: 7,
    turnsRequired: 1.5,
    rarity: 'uncommon',
    difficultyMultiplier: 1.0,
    baits: ['prawn']
  },
  {
    id: 'summer_flounder',
    name: 'Summer Flounder',
    // The famous "fluke" - a genuinely more predatory flatfish than most,
    // known to take small baitfish and squid readily.
    baseWeightKg: 1.0,
    valuePerKg: 8,
    turnsRequired: 1.5,
    rarity: 'uncommon',
    difficultyMultiplier: 1.05,
    baits: ['prawn', 'squid']
  },
  {
    id: 'garfish',
    name: 'Garfish',
    // A tiny, delicate surface halfbeak - a light, prized eating fish,
    // but no fight at all to reel in.
    baseWeightKg: 0.15,
    valuePerKg: 9,
    turnsRequired: 1.0,
    rarity: 'common',
    difficultyMultiplier: 0.6,
    baits: ['prawn']
  },
  {
    id: 'southern_garfish',
    name: 'Southern Garfish',
    baseWeightKg: 0.12,
    valuePerKg: 10,
    turnsRequired: 1.0,
    rarity: 'common',
    difficultyMultiplier: 0.6,
    baits: ['prawn']
  },
  {
    id: 'gemfish',
    name: 'Gemfish',
    // A sharp-toothed, fast-swimming snake mackerel - a genuine predator,
    // and a decent fight for its lean build.
    baseWeightKg: 3.5,
    valuePerKg: 10,
    turnsRequired: 2.2,
    rarity: 'uncommon',
    difficultyMultiplier: 1.6,
    baits: ['prawn', 'squid']
  },
  {
    id: 'giant_trevally',
    name: 'Giant Trevally',
    // The biggest, hardest-fighting jack in the game - real GT are
    // legendary as one of the toughest inshore gamefish there is, a fight
    // that closes in on shark territory.
    baseWeightKg: 15.0,
    valuePerKg: 13,
    turnsRequired: 3.2,
    rarity: 'rare',
    difficultyMultiplier: 2.1,
    baits: ['prawn', 'squid']
  },
  {
    id: 'golden_trevally',
    name: 'Golden Trevally',
    baseWeightKg: 4.0,
    valuePerKg: 9,
    turnsRequired: 2.2,
    rarity: 'uncommon',
    difficultyMultiplier: 1.4,
    baits: ['prawn', 'squid']
  },
  {
    id: 'silver_trevally',
    name: 'Silver Trevally',
    baseWeightKg: 1.5,
    valuePerKg: 7,
    turnsRequired: 1.9,
    rarity: 'common',
    difficultyMultiplier: 1.1,
    baits: ['prawn', 'squid']
  },
  {
    id: 'grey_morwong',
    name: 'Grey Morwong',
    baseWeightKg: 1.8,
    valuePerKg: 7,
    turnsRequired: 1.9,
    rarity: 'uncommon',
    difficultyMultiplier: 1.2,
    baits: ['prawn']
  },
  {
    id: 'jackass_morwong',
    name: 'Jackass Morwong',
    baseWeightKg: 1.5,
    valuePerKg: 7.5,
    turnsRequired: 1.9,
    rarity: 'uncommon',
    difficultyMultiplier: 1.2,
    baits: ['prawn']
  },
  {
    id: 'blue_groper',
    name: 'Blue Groper',
    // A big, strong reef wrasse - a real crustacean/shellfish feeder, not
    // a squid predator, so it only ever takes the Prawn.
    baseWeightKg: 6.0,
    valuePerKg: 12,
    turnsRequired: 2.4,
    rarity: 'rare',
    difficultyMultiplier: 1.6,
    baits: ['prawn']
  },
  {
    id: 'bonito',
    name: 'Bonito',
    // A smaller, leaner tuna relative - a fast, spirited fighter.
    baseWeightKg: 2.8,
    valuePerKg: 9,
    turnsRequired: 2.1,
    rarity: 'uncommon',
    difficultyMultiplier: 1.55,
    baits: ['prawn', 'squid']
  },
  {
    id: 'cobia',
    name: 'Cobia',
    // A big, powerful, shark-shaped gamefish - one of the toughest non-
    // shark fights in the game.
    baseWeightKg: 12.0,
    valuePerKg: 12,
    turnsRequired: 2.9,
    rarity: 'rare',
    difficultyMultiplier: 1.9,
    baits: ['prawn', 'squid']
  },
  {
    id: 'dusky_flathead',
    name: 'Dusky Flathead',
    // The biggest and most familiar flathead species - a genuine prize
    // among the five flathead here.
    baseWeightKg: 2.2,
    valuePerKg: 6,
    turnsRequired: 2.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.35,
    baits: ['prawn', 'squid']
  },
  {
    id: 'tiger_flathead',
    name: 'Tiger Flathead',
    // An offshore flathead species, smaller than the Dusky.
    baseWeightKg: 1.0,
    valuePerKg: 6,
    turnsRequired: 1.8,
    rarity: 'uncommon',
    difficultyMultiplier: 1.25,
    baits: ['prawn', 'squid']
  },
  {
    id: 'bluespotted_flathead',
    name: 'Bluespotted Flathead',
    baseWeightKg: 0.8,
    valuePerKg: 6.5,
    turnsRequired: 1.7,
    rarity: 'uncommon',
    difficultyMultiplier: 1.2,
    baits: ['prawn', 'squid']
  },
  {
    id: 'sand_flathead',
    name: 'Sand Flathead',
    // The smallest, plainest, most common of the five flathead - a light
    // bay/estuary catch.
    baseWeightKg: 0.6,
    valuePerKg: 4.5,
    turnsRequired: 1.5,
    rarity: 'common',
    difficultyMultiplier: 1.05,
    baits: ['prawn', 'squid']
  },
  {
    id: 'rock_flathead',
    name: 'Rock Flathead',
    baseWeightKg: 0.9,
    valuePerKg: 5.5,
    turnsRequired: 1.7,
    rarity: 'uncommon',
    difficultyMultiplier: 1.2,
    baits: ['prawn', 'squid']
  },
  {
    id: 'flounder',
    name: 'Flounder',
    // A flatfish - a weak fighter, and a real bottom-feeder on small
    // crustaceans/worms, so it only ever takes the Prawn, never squid.
    baseWeightKg: 0.6,
    valuePerKg: 7,
    turnsRequired: 1.4,
    rarity: 'uncommon',
    difficultyMultiplier: 0.9,
    baits: ['prawn']
  },
  {
    id: 'australian_salmon',
    name: 'Australian Salmon',
    // Despite the name, not a true salmonid at all (see tackle.js) - a
    // pelagic schooling predator, occupying the same rare/mid-value slot
    // the generic "Salmon" used to.
    baseWeightKg: 3.0,
    valuePerKg: 8,
    turnsRequired: 2.3,
    rarity: 'rare',
    difficultyMultiplier: 1.6,
    // Readily takes either - a classic Australian Salmon bait fish.
    baits: ['prawn', 'squid']
  },
  {
    id: 'australian_herring',
    name: 'Australian Herring',
    // A much smaller relative of the Australian Salmon (same genus,
    // Arripis) - a light, common catch, and a weak fighter for its size.
    baseWeightKg: 0.3,
    valuePerKg: 5,
    turnsRequired: 1.4,
    rarity: 'common',
    difficultyMultiplier: 0.9,
    // A tiny-mouthed baitfish - real bait is small strips/prawns, not a
    // tough squid strip.
    baits: ['prawn']
  },
  {
    id: 'albacore',
    name: 'Albacore',
    // A true tuna species - a strong, fast pelagic gamefish, priced and
    // sized between the Spotted Mackerel and the bigger Tuna.
    baseWeightKg: 7.0,
    valuePerKg: 11,
    turnsRequired: 2.6,
    rarity: 'rare',
    difficultyMultiplier: 1.8,
    // Squid is a staple natural Albacore prey item.
    baits: ['prawn', 'squid']
  },
  {
    id: 'amberjack',
    name: 'Amberjack',
    // A big, powerful jack relative of the Kingfish - a real brute of a
    // fight, priced close to the Kingfish but a touch heavier on average.
    baseWeightKg: 8.0,
    valuePerKg: 10,
    turnsRequired: 2.6,
    rarity: 'rare',
    difficultyMultiplier: 1.75,
    baits: ['prawn', 'squid']
  },
  {
    id: 'barramundi',
    name: 'Barramundi',
    // The iconic Australian estuarine gamefish - a real fighter known for
    // aerial jumps and headshakes, priced as a genuine prize catch.
    baseWeightKg: 5.0,
    valuePerKg: 13,
    turnsRequired: 2.5,
    rarity: 'rare',
    difficultyMultiplier: 1.85,
    // Barra take both live/dead bait readily - prawns are a classic barra
    // bait, and squid strips work just as well.
    baits: ['prawn', 'squid']
  },
  {
    id: 'black_bream',
    name: 'Black Bream',
    baseWeightKg: 0.9,
    valuePerKg: 7,
    turnsRequired: 1.8,
    rarity: 'uncommon',
    difficultyMultiplier: 1.2,
    baits: ['prawn', 'squid']
  },
  {
    id: 'yellowfin_bream',
    name: 'Yellowfin Bream',
    baseWeightKg: 1.0,
    valuePerKg: 6.5,
    turnsRequired: 1.8,
    rarity: 'uncommon',
    difficultyMultiplier: 1.15,
    baits: ['prawn', 'squid']
  },
  {
    id: 'tarwhine',
    name: 'Tarwhine',
    baseWeightKg: 0.7,
    valuePerKg: 5,
    turnsRequired: 1.6,
    rarity: 'common',
    difficultyMultiplier: 1.0,
    baits: ['prawn', 'squid']
  },
  {
    id: 'black_jewfish',
    name: 'Black Jewfish',
    // A big, powerful estuarine croaker - genuinely one of the toughest
    // non-shark fights in the game, and priced to match.
    baseWeightKg: 22.0,
    valuePerKg: 15,
    turnsRequired: 3.4,
    rarity: 'rare',
    difficultyMultiplier: 2.0,
    baits: ['prawn', 'squid']
  },
  {
    id: 'blue_eye_trevalla',
    name: 'Blue-eye Trevalla',
    // Only turns up once the hook is past 600m (see
    // OceanScene.NORMAL_POOL/DEPTH_LIMITS) - a real continental-shelf deep
    // dropper species, sitting between the Coral Trout's 200m and the
    // Angler Fish's abyssal 4000m.
    baseWeightKg: 9.0,
    valuePerKg: 18,
    turnsRequired: 2.7,
    rarity: 'rare',
    difficultyMultiplier: 1.9,
    baits: ['prawn', 'squid']
  },
  {
    id: 'mullet',
    name: 'Mullet',
    // A common, easy-going schooling fish - smaller and cheaper than the
    // Flathead, and the least of a fight to reel in.
    baseWeightKg: 1.3,
    valuePerKg: 4,
    turnsRequired: 1.7,
    rarity: 'common',
    difficultyMultiplier: 1.0,
    // Mullet are mostly herbivorous grazers, not predators - a real one
    // won't look twice at a tough squid strip, only the Prawn.
    baits: ['prawn']
  },
  {
    id: 'bream',
    name: 'Bream',
    // A decent eating fish, a step up from the Mullet - a bit heavier, a
    // bit more valuable, and a bit more of a fight, without matching the
    // Flathead or Salmon.
    baseWeightKg: 1.1,
    valuePerKg: 6,
    turnsRequired: 1.8,
    rarity: 'uncommon',
    difficultyMultiplier: 1.15,
    // An opportunistic omnivore - both are genuine real-world Bream baits.
    baits: ['prawn', 'squid']
  },
  {
    id: 'tuna',
    name: 'Tuna',
    // The big one - heavier than the Salmon, worth the most per kg, and by
    // far the toughest fight of any of them.
    baseWeightKg: 5.5,
    valuePerKg: 12,
    turnsRequired: 2.8,
    rarity: 'rare',
    difficultyMultiplier: 1.9,
    // Squid is a staple natural prey item for Tuna.
    baits: ['prawn', 'squid']
  },
  {
    id: 'spotted_mackerel',
    name: 'Spotted Mackerel',
    // A fast, toothy scombrid predator - lighter than the Tuna, but a
    // genuinely spirited fighter for its size.
    baseWeightKg: 2.5,
    valuePerKg: 9,
    turnsRequired: 2.0,
    rarity: 'uncommon',
    difficultyMultiplier: 1.5,
    // A classic squid/baitfish predator.
    baits: ['prawn', 'squid']
  },
  {
    id: 'tailor',
    name: 'Tailor',
    // Modest size, but a real scrapper for it - punches above its weight
    // in the reel fight compared to fish of similar size like the Bream.
    baseWeightKg: 1.0,
    valuePerKg: 5.5,
    turnsRequired: 1.9,
    rarity: 'uncommon',
    difficultyMultiplier: 1.35,
    // An aggressive predator, happy to take either.
    baits: ['prawn', 'squid']
  },
  {
    id: 'trevally',
    name: 'Trevally',
    // A solid, deep-bodied fish with a real reputation as a hard fighter -
    // noticeably tougher than its size alone would suggest, closing in on
    // the Salmon's own fight despite being a fair bit lighter.
    baseWeightKg: 2.0,
    valuePerKg: 7,
    turnsRequired: 2.1,
    rarity: 'uncommon',
    difficultyMultiplier: 1.45,
    baits: ['prawn', 'squid']
  },
  {
    id: 'coral_trout',
    name: 'Coral Trout',
    // Only turns up once the hook is past 200m (see
    // OceanScene.NORMAL_POOL/DEPTH_LIMITS) - a genuine deep-water prize, a
    // solid fight, and priced accordingly.
    baseWeightKg: 3.0,
    valuePerKg: 14,
    turnsRequired: 2.2,
    rarity: 'rare',
    difficultyMultiplier: 1.5,
    baits: ['prawn', 'squid']
  },
  {
    id: 'angler_fish',
    name: 'Angler Fish',
    // Only turns up once the hook is past 4000m (see
    // OceanScene.NORMAL_POOL/DEPTH_LIMITS) - the deepest-dwelling catch in
    // the game by a huge margin. Small like the real animal, but priced
    // the highest per kg of anything short of a shark, reflecting just how
    // absurd a line has to be to ever reach it. Low wariness - a real
    // anglerfish is a passive ambush predator, not something that spooks
    // and bolts.
    baseWeightKg: 1.2,
    valuePerKg: 25,
    turnsRequired: 2.0,
    rarity: 'legendary',
    difficultyMultiplier: 1.2,
    // An opportunistic abyssal ambush predator - takes whatever drifts by.
    baits: ['prawn', 'squid']
  },
  {
    id: 'dragonfish',
    name: 'Dragonfish',
    // Only turns up once the hook is past 1500m (see
    // OceanScene.NORMAL_POOL/DEPTH_LIMITS) - sits between the Blue-eye
    // Trevalla's 600m and the Angler Fish's abyssal 4000m. Tiny like the
    // real animal (real dragonfish rarely top 30cm), so priced very high
    // per kg to still feel like a real find rather than pocket change.
    baseWeightKg: 0.4,
    valuePerKg: 60,
    turnsRequired: 2.3,
    rarity: 'legendary',
    difficultyMultiplier: 1.4,
    // A passive abyssal ambush predator like the Angler Fish - not
    // picky about what's drifting on the hook.
    baits: ['prawn', 'squid']
  },
  {
    id: 'fangtooth',
    name: 'Fangtooth',
    // Only turns up once the hook is past 2000m (see
    // OceanScene.NORMAL_POOL/DEPTH_LIMITS/ABYSS_FISH) - sits between the
    // Dragonfish's 1500m and the Angler Fish's abyssal 4000m. Also, unlike
    // any other depth-gated species, reachable at ANY depth while fishing
    // with Abyssal Bait, same as the rest of ABYSS_FISH. Tiny like the
    // real animal (rarely over 16cm), priced high per kg for the same
    // reason the Dragonfish is.
    baseWeightKg: 0.5,
    valuePerKg: 50,
    turnsRequired: 2.1,
    rarity: 'legendary',
    difficultyMultiplier: 1.3,
    // A passive abyssal ambush predator like the Angler Fish and
    // Dragonfish - not picky about what's drifting on the hook.
    baits: ['prawn', 'squid']
  },
  {
    id: 'whiting',
    name: 'Whiting',
    // A small, prized table fish - much lighter than the others and no real
    // fight to reel in, but still worth good money per kg.
    baseWeightKg: 0.5,
    valuePerKg: 8,
    turnsRequired: 1.6,
    rarity: 'common',
    difficultyMultiplier: 1.0,
    // A tiny-mouthed bottom feeder - real whiting bait is worms/prawns,
    // never a tough squid strip.
    baits: ['prawn']
  },
  {
    id: 'kingfish',
    name: 'Yellowtail Kingfish',
    // A big, strong pelagic gamefish - heavier and more valuable than the
    // Trevally, and a real fight to reel in, though not in the same league
    // as the Tuna or the sharks.
    baseWeightKg: 6.0,
    valuePerKg: 11,
    turnsRequired: 2.4,
    rarity: 'rare',
    difficultyMultiplier: 1.7,
    // Squid is a prime real-world Kingfish bait.
    baits: ['prawn', 'squid']
  },
  {
    id: 'great_white',
    name: 'Great White Shark',
    // The legendary catch - not in the normal spawn pool at all (see
    // OceanScene.SHARK_BAIT): it only has a chance to appear when fishing
    // with one of its own realistic prey species as bait (large, fatty
    // pelagic fish - Tuna, Australian Salmon, Kingfish, Albacore,
    // Amberjack, or a smaller shark), and even then it's a rare event, not
    // a guarantee. Enormous, by far the most valuable thing in the game,
    // and the single toughest fight there is.
    baseWeightKg: 220,
    valuePerKg: 15,
    // Turned up well past the Tuna's own numbers (2.8/1.9) on purpose - any
    // shark should be a genuine, sustained struggle to land, not just
    // another fish with a bigger number attached.
    turnsRequired: 4.2,
    rarity: 'legendary',
    difficultyMultiplier: 2.8
  },
  {
    id: 'tiger_shark',
    name: 'Tiger Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // real tiger sharks are famous indiscriminate generalists ("the
    // wastebasket of the sea"), so they answer to the widest range of bait
    // fish of any shark here, and are a bit more likely to turn up than the
    // Great White, but still rare. Smaller and less valuable than the Great
    // White, but every bit as much of a fight to land - every shark in the
    // game is a real struggle, not just the rarest one.
    baseWeightKg: 145,
    valuePerKg: 12,
    turnsRequired: 3.9,
    rarity: 'legendary',
    difficultyMultiplier: 2.6
  },
  {
    id: 'bull_shark',
    name: 'Bull Shark',
    // Also only reachable via the right bait (see OceanScene.SHARK_BAIT) -
    // real bull sharks are opportunistic estuarine hunters, so they answer
    // to the inshore/estuary fish here. Sits squarely between the other two
    // sharks in both weight and value - heavier than the
    // Tiger Shark despite being the shortest of the three (a real bull
    // shark is stocky rather than long), but still well short of the Great
    // White's own size.
    baseWeightKg: 190,
    valuePerKg: 13,
    turnsRequired: 4.0,
    rarity: 'legendary',
    difficultyMultiplier: 2.7
  },
  {
    id: 'megalodon',
    name: 'Megalodon',
    // Not reachable through the normal spawn roll at all - the only way to
    // ever see one is OceanScene.MEGALODON_CHANCE swapping in a Megalodon
    // at the very instant one of the three real sharks bites, and that
    // chance is deliberately tiny. The single rarest and by a huge margin
    // the most valuable catch in the game.
    baseWeightKg: 6000,
    valuePerKg: 20,
    turnsRequired: 5.0,
    rarity: 'legendary',
    difficultyMultiplier: 5.0
  },
  {
    id: 'humpback_whale',
    name: 'Humpback Whale',
    // Not a fish, and not in the normal spawn pool at all (see
    // OceanScene.WHALE_BAIT) - only reachable while fishing with Squid,
    // Prawn, Australian Salmon, or one of the Mackerel species, the same
    // small schooling prey and incidental bycatch a real humpback actually
    // feeds on out in open water. Even then the odds are kept far below the
    // Manta Ray's own already-lowest chance in the game - a genuine
    // once-in-a-great-while encounter, not a repeatable trophy. By a huge
    // margin the single biggest thing that can ever turn up on the line,
    // real adult humpbacks run to this kind of weight - but only modestly
    // valuable per kilo, since its sheer rarity is the point, not a payout.
    baseWeightKg: 30000,
    valuePerKg: 1,
    turnsRequired: 5.0,
    rarity: 'legendary',
    difficultyMultiplier: 3.0
  }
];

export function getFish(id) {
  return FISH.find((f) => f.id === id);
}
