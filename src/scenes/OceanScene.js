import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import { getCatchable, rarityColorFor, rarityTierFor } from '../data/catchables.js';
import { currentUpgrade } from '../data/upgradeData.js';
import { createIconButton, drawShopIcon, drawBagIcon, drawPencilIcon } from '../ui/iconButton.js';
import { addStatusBar } from '../ui/fishIcon.js';
import {
  drawHook,
  drawPrawn,
  drawSquid,
  drawDeepSeaBait,
  drawChumBait,
  drawColossalBait,
  drawPlasticLure,
  drawShimmeringLure,
  drawAbyssalBait,
  drawFlathead,
  drawRedMorwong,
  drawBandedMorwong,
  drawBlueMorwong,
  drawHairtail,
  drawHapuku,
  drawLeatherjacket,
  drawLongtailTuna,
  drawYellowfinTuna,
  drawSouthernBluefinTuna,
  drawBigeyeTuna,
  drawSkipjackTuna,
  drawBlackfinTuna,
  drawDogtoothTuna,
  drawLuderick,
  drawSpanishMackerel,
  drawSchoolMackerel,
  drawKingMackerel,
  drawMahiMahi,
  drawMangroveJack,
  drawBlackMarlin,
  drawBlueMarlin,
  drawStripedMarlin,
  drawWhiteMarlin,
  drawMosesPerch,
  drawMulloway,
  drawPearlPerch,
  drawPinkSnapper,
  drawRedSnapper,
  drawMangroveSnapper,
  drawVermilionSnapper,
  drawSilkSnapper,
  drawQueenfish,
  drawRedEmperor,
  drawCrimsonSnapper,
  drawFingermark,
  drawNannygai,
  drawSailfish,
  drawSamsonfish,
  drawSandWhiting,
  drawSchoolWhiting,
  drawKingGeorgeWhiting,
  drawYellowfinWhiting,
  drawTrumpeterWhiting,
  drawSnook,
  drawTeraglin,
  drawWahoo,
  drawDhufish,
  drawBaldchinGroper,
  drawTuskfish,
  drawBlackspotTuskfish,
  drawBlueTuskfish,
  drawBlackSeaBass,
  drawGagGrouper,
  drawRedGrouper,
  drawBlackGrouper,
  drawScamp,
  drawWarsawGrouper,
  drawRedDrum,
  drawBlackDrum,
  drawSpottedSeatrout,
  drawWeakfish,
  drawTarpon,
  drawBonefish,
  drawPermit,
  drawStripedBass,
  drawSheepshead,
  drawHogfish,
  drawFloridaPompano,
  drawCrevalleJack,
  drawLadyfish,
  drawTripletail,
  drawAtlanticCroaker,
  drawSpot,
  drawPigfish,
  drawWhiteGrunt,
  drawRedPorgy,
  drawScup,
  drawTautog,
  drawGoldenTilefish,
  drawBlueLineTilefish,
  drawAtlanticMackerel,
  drawCeroMackerel,
  drawLittleTunny,
  drawAtlanticBonito,
  drawShortfinMako,
  drawWhalerShark,
  drawBronzeWhaler,
  drawDuskyShark,
  drawBlacktipShark,
  drawSpinnerShark,
  drawHammerhead,
  drawScallopedHammerhead,
  drawGreatHammerhead,
  drawWobbegong,
  drawOrnateWobbegong,
  drawSpottedWobbegong,
  drawGummyShark,
  drawSchoolShark,
  drawBlueShark,
  drawSpinyDogfish,
  drawSmoothDogfish,
  drawSevenGilledShark,
  drawSixGilledShark,
  drawSawshark,
  drawThresherShark,
  drawAngelShark,
  drawNurseShark,
  drawLemonShark,
  drawSandbarShark,
  drawBlacktipReefShark,
  drawGuitarfish,
  drawShovelnoseRay,
  drawEagleRay,
  drawMantaRay,
  drawDevilRay,
  drawStingray,
  drawSouthernStingray,
  drawCownoseRay,
  drawButterflyRay,
  drawElectricRay,
  drawTorpedoRay,
  drawBanjoRay,
  drawFiddlerRay,
  drawBarndoorSkate,
  drawWinterSkate,
  drawClearnoseSkate,
  drawLittleSkate,
  drawGreatBarracuda,
  drawPickhandleBarracuda,
  drawFatSnook,
  drawAfricanPompano,
  drawLookdown,
  drawSouthernFlounder,
  drawSummerFlounder,
  drawGarfish,
  drawSouthernGarfish,
  drawGemfish,
  drawGiantTrevally,
  drawGoldenTrevally,
  drawSilverTrevally,
  drawGreyMorwong,
  drawJackassMorwong,
  drawBlueGroper,
  drawBonito,
  drawCobia,
  drawDuskyFlathead,
  drawTigerFlathead,
  drawBluespottedFlathead,
  drawSandFlathead,
  drawRockFlathead,
  drawFlounder,
  drawAustralianSalmon,
  drawAustralianHerring,
  drawAlbacore,
  drawAmberjack,
  drawBarramundi,
  drawBlackBream,
  drawYellowfinBream,
  drawTarwhine,
  drawBlackJewfish,
  drawBlueEyeTrevalla,
  drawMullet,
  drawBream,
  drawTuna,
  drawSpottedMackerel,
  drawTailor,
  drawTrevally,
  drawKingfish,
  drawWhiting,
  drawCoralTrout,
  drawAngler,
  drawDragonfish,
  drawFangtooth,
  drawGreatWhite,
  drawTigerShark,
  drawBullShark,
  drawMegalodon,
  drawHumpbackWhale,
  drawOldBoot
} from '../ui/tackle.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants.js';
import { shadeColor, buildSeaPolygon, drawSunGlow } from '../ui/oceanArt.js';
import { subheading, label } from '../ui/textStyle.js';

const DRAWERS = {
  prawn: drawPrawn,
  squid: drawSquid,
  deep_sea_bait: drawDeepSeaBait,
  chum_bait: drawChumBait,
  colossal_bait: drawColossalBait,
  plastic_lure: drawPlasticLure,
  shimmering_lure: drawShimmeringLure,
  abyssal_bait: drawAbyssalBait,
  flathead: drawFlathead,
  red_morwong: drawRedMorwong,
  banded_morwong: drawBandedMorwong,
  blue_morwong: drawBlueMorwong,
  hairtail: drawHairtail,
  hapuku: drawHapuku,
  leatherjacket: drawLeatherjacket,
  longtail_tuna: drawLongtailTuna,
  yellowfin_tuna: drawYellowfinTuna,
  southern_bluefin_tuna: drawSouthernBluefinTuna,
  bigeye_tuna: drawBigeyeTuna,
  skipjack_tuna: drawSkipjackTuna,
  blackfin_tuna: drawBlackfinTuna,
  dogtooth_tuna: drawDogtoothTuna,
  luderick: drawLuderick,
  spanish_mackerel: drawSpanishMackerel,
  school_mackerel: drawSchoolMackerel,
  king_mackerel: drawKingMackerel,
  mahi_mahi: drawMahiMahi,
  mangrove_jack: drawMangroveJack,
  black_marlin: drawBlackMarlin,
  blue_marlin: drawBlueMarlin,
  striped_marlin: drawStripedMarlin,
  white_marlin: drawWhiteMarlin,
  moses_perch: drawMosesPerch,
  mulloway: drawMulloway,
  pearl_perch: drawPearlPerch,
  pink_snapper: drawPinkSnapper,
  red_snapper: drawRedSnapper,
  mangrove_snapper: drawMangroveSnapper,
  vermilion_snapper: drawVermilionSnapper,
  silk_snapper: drawSilkSnapper,
  queenfish: drawQueenfish,
  red_emperor: drawRedEmperor,
  crimson_snapper: drawCrimsonSnapper,
  fingermark: drawFingermark,
  nannygai: drawNannygai,
  sailfish: drawSailfish,
  samsonfish: drawSamsonfish,
  sand_whiting: drawSandWhiting,
  school_whiting: drawSchoolWhiting,
  king_george_whiting: drawKingGeorgeWhiting,
  yellowfin_whiting: drawYellowfinWhiting,
  trumpeter_whiting: drawTrumpeterWhiting,
  snook: drawSnook,
  teraglin: drawTeraglin,
  wahoo: drawWahoo,
  dhufish: drawDhufish,
  baldchin_groper: drawBaldchinGroper,
  tuskfish: drawTuskfish,
  blackspot_tuskfish: drawBlackspotTuskfish,
  blue_tuskfish: drawBlueTuskfish,
  black_sea_bass: drawBlackSeaBass,
  gag_grouper: drawGagGrouper,
  red_grouper: drawRedGrouper,
  black_grouper: drawBlackGrouper,
  scamp: drawScamp,
  warsaw_grouper: drawWarsawGrouper,
  red_drum: drawRedDrum,
  black_drum: drawBlackDrum,
  spotted_seatrout: drawSpottedSeatrout,
  weakfish: drawWeakfish,
  tarpon: drawTarpon,
  bonefish: drawBonefish,
  permit: drawPermit,
  striped_bass: drawStripedBass,
  sheepshead: drawSheepshead,
  hogfish: drawHogfish,
  florida_pompano: drawFloridaPompano,
  crevalle_jack: drawCrevalleJack,
  ladyfish: drawLadyfish,
  tripletail: drawTripletail,
  atlantic_croaker: drawAtlanticCroaker,
  spot: drawSpot,
  pigfish: drawPigfish,
  white_grunt: drawWhiteGrunt,
  red_porgy: drawRedPorgy,
  scup: drawScup,
  tautog: drawTautog,
  golden_tilefish: drawGoldenTilefish,
  blueline_tilefish: drawBlueLineTilefish,
  atlantic_mackerel: drawAtlanticMackerel,
  cero_mackerel: drawCeroMackerel,
  little_tunny: drawLittleTunny,
  atlantic_bonito: drawAtlanticBonito,
  shortfin_mako: drawShortfinMako,
  whaler_shark: drawWhalerShark,
  bronze_whaler: drawBronzeWhaler,
  dusky_shark: drawDuskyShark,
  blacktip_shark: drawBlacktipShark,
  spinner_shark: drawSpinnerShark,
  hammerhead: drawHammerhead,
  scalloped_hammerhead: drawScallopedHammerhead,
  great_hammerhead: drawGreatHammerhead,
  wobbegong: drawWobbegong,
  ornate_wobbegong: drawOrnateWobbegong,
  spotted_wobbegong: drawSpottedWobbegong,
  gummy_shark: drawGummyShark,
  school_shark: drawSchoolShark,
  blue_shark: drawBlueShark,
  spiny_dogfish: drawSpinyDogfish,
  smooth_dogfish: drawSmoothDogfish,
  seven_gilled_shark: drawSevenGilledShark,
  six_gilled_shark: drawSixGilledShark,
  sawshark: drawSawshark,
  thresher_shark: drawThresherShark,
  angel_shark: drawAngelShark,
  nurse_shark: drawNurseShark,
  lemon_shark: drawLemonShark,
  sandbar_shark: drawSandbarShark,
  blacktip_reef_shark: drawBlacktipReefShark,
  guitarfish: drawGuitarfish,
  shovelnose_ray: drawShovelnoseRay,
  eagle_ray: drawEagleRay,
  manta_ray: drawMantaRay,
  devil_ray: drawDevilRay,
  stingray: drawStingray,
  southern_stingray: drawSouthernStingray,
  cownose_ray: drawCownoseRay,
  butterfly_ray: drawButterflyRay,
  electric_ray: drawElectricRay,
  torpedo_ray: drawTorpedoRay,
  banjo_ray: drawBanjoRay,
  fiddler_ray: drawFiddlerRay,
  barndoor_skate: drawBarndoorSkate,
  winter_skate: drawWinterSkate,
  clearnose_skate: drawClearnoseSkate,
  little_skate: drawLittleSkate,
  great_barracuda: drawGreatBarracuda,
  pickhandle_barracuda: drawPickhandleBarracuda,
  fat_snook: drawFatSnook,
  african_pompano: drawAfricanPompano,
  lookdown: drawLookdown,
  southern_flounder: drawSouthernFlounder,
  summer_flounder: drawSummerFlounder,
  garfish: drawGarfish,
  southern_garfish: drawSouthernGarfish,
  gemfish: drawGemfish,
  giant_trevally: drawGiantTrevally,
  golden_trevally: drawGoldenTrevally,
  silver_trevally: drawSilverTrevally,
  grey_morwong: drawGreyMorwong,
  jackass_morwong: drawJackassMorwong,
  blue_groper: drawBlueGroper,
  bonito: drawBonito,
  cobia: drawCobia,
  dusky_flathead: drawDuskyFlathead,
  tiger_flathead: drawTigerFlathead,
  bluespotted_flathead: drawBluespottedFlathead,
  sand_flathead: drawSandFlathead,
  rock_flathead: drawRockFlathead,
  flounder: drawFlounder,
  australian_salmon: drawAustralianSalmon,
  australian_herring: drawAustralianHerring,
  albacore: drawAlbacore,
  amberjack: drawAmberjack,
  barramundi: drawBarramundi,
  black_bream: drawBlackBream,
  yellowfin_bream: drawYellowfinBream,
  tarwhine: drawTarwhine,
  black_jewfish: drawBlackJewfish,
  blue_eye_trevalla: drawBlueEyeTrevalla,
  mullet: drawMullet,
  bream: drawBream,
  tuna: drawTuna,
  spotted_mackerel: drawSpottedMackerel,
  tailor: drawTailor,
  trevally: drawTrevally,
  kingfish: drawKingfish,
  whiting: drawWhiting,
  coral_trout: drawCoralTrout,
  angler_fish: drawAngler,
  dragonfish: drawDragonfish,
  fangtooth: drawFangtooth,
  great_white: drawGreatWhite,
  tiger_shark: drawTigerShark,
  bull_shark: drawBullShark,
  megalodon: drawMegalodon,
  humpback_whale: drawHumpbackWhale,
  old_boot: drawOldBoot
};

// Modest, natural-looking scale for whatever's actually dangling on the
// hook while fishing - NOT the big dramatic scale used for the catch
// reveal below.
const BAIT_HOOK_SCALE = {
  prawn: 0.34,
  squid: 0.32,
  deep_sea_bait: 0.32,
  chum_bait: 0.34,
  colossal_bait: 0.4,
  plastic_lure: 0.75,
  shimmering_lure: 0.75,
  abyssal_bait: 0.85,
  flathead: 0.42,
  red_morwong: 0.38,
  banded_morwong: 0.38,
  blue_morwong: 0.36,
  hairtail: 0.3,
  hapuku: 0.3,
  leatherjacket: 0.42,
  longtail_tuna: 0.34,
  yellowfin_tuna: 0.34,
  southern_bluefin_tuna: 0.32,
  bigeye_tuna: 0.34,
  skipjack_tuna: 0.34,
  blackfin_tuna: 0.34,
  dogtooth_tuna: 0.36,
  luderick: 0.36,
  spanish_mackerel: 0.34,
  school_mackerel: 0.36,
  king_mackerel: 0.34,
  mahi_mahi: 0.36,
  mangrove_jack: 0.38,
  black_marlin: 0.3,
  blue_marlin: 0.28,
  striped_marlin: 0.3,
  white_marlin: 0.34,
  moses_perch: 0.42,
  mulloway: 0.32,
  pearl_perch: 0.4,
  pink_snapper: 0.38,
  red_snapper: 0.38,
  mangrove_snapper: 0.38,
  vermilion_snapper: 0.4,
  silk_snapper: 0.38,
  queenfish: 0.36,
  red_emperor: 0.36,
  crimson_snapper: 0.38,
  fingermark: 0.36,
  nannygai: 0.4,
  sailfish: 0.32,
  samsonfish: 0.36,
  sand_whiting: 0.36,
  school_whiting: 0.3,
  king_george_whiting: 0.34,
  yellowfin_whiting: 0.32,
  trumpeter_whiting: 0.32,
  snook: 0.38,
  teraglin: 0.36,
  wahoo: 0.32,
  dhufish: 0.36,
  baldchin_groper: 0.38,
  tuskfish: 0.4,
  blackspot_tuskfish: 0.38,
  blue_tuskfish: 0.38,
  black_sea_bass: 0.4,
  gag_grouper: 0.36,
  red_grouper: 0.36,
  black_grouper: 0.36,
  scamp: 0.4,
  warsaw_grouper: 0.32,
  red_drum: 0.38,
  black_drum: 0.34,
  spotted_seatrout: 0.4,
  weakfish: 0.4,
  tarpon: 0.34,
  bonefish: 0.4,
  permit: 0.36,
  striped_bass: 0.38,
  sheepshead: 0.38,
  hogfish: 0.38,
  florida_pompano: 0.42,
  crevalle_jack: 0.36,
  ladyfish: 0.4,
  tripletail: 0.4,
  atlantic_croaker: 0.4,
  spot: 0.42,
  pigfish: 0.4,
  white_grunt: 0.42,
  red_porgy: 0.4,
  scup: 0.44,
  tautog: 0.4,
  golden_tilefish: 0.36,
  blueline_tilefish: 0.38,
  atlantic_mackerel: 0.38,
  cero_mackerel: 0.36,
  little_tunny: 0.38,
  atlantic_bonito: 0.36,
  shortfin_mako: 0.7,
  whaler_shark: 0.62,
  bronze_whaler: 0.64,
  dusky_shark: 0.72,
  blacktip_shark: 0.56,
  spinner_shark: 0.58,
  hammerhead: 0.66,
  scalloped_hammerhead: 0.68,
  great_hammerhead: 0.8,
  wobbegong: 0.46,
  ornate_wobbegong: 0.48,
  spotted_wobbegong: 0.5,
  gummy_shark: 0.42,
  school_shark: 0.52,
  blue_shark: 0.66,
  spiny_dogfish: 0.3,
  smooth_dogfish: 0.28,
  seven_gilled_shark: 0.7,
  six_gilled_shark: 0.84,
  sawshark: 0.44,
  thresher_shark: 0.6,
  angel_shark: 0.42,
  nurse_shark: 0.6,
  lemon_shark: 0.62,
  sandbar_shark: 0.66,
  blacktip_reef_shark: 0.4,
  guitarfish: 0.42,
  shovelnose_ray: 0.43,
  eagle_ray: 0.38,
  manta_ray: 0.5,
  devil_ray: 0.4,
  stingray: 0.32,
  southern_stingray: 0.34,
  cownose_ray: 0.3,
  butterfly_ray: 0.32,
  electric_ray: 0.3,
  torpedo_ray: 0.36,
  banjo_ray: 0.28,
  fiddler_ray: 0.29,
  barndoor_skate: 0.32,
  winter_skate: 0.28,
  clearnose_skate: 0.26,
  little_skate: 0.2,
  great_barracuda: 0.38,
  pickhandle_barracuda: 0.3,
  fat_snook: 0.32,
  african_pompano: 0.34,
  lookdown: 0.24,
  southern_flounder: 0.4,
  summer_flounder: 0.4,
  garfish: 0.3,
  southern_garfish: 0.3,
  gemfish: 0.36,
  giant_trevally: 0.32,
  golden_trevally: 0.38,
  silver_trevally: 0.4,
  grey_morwong: 0.4,
  jackass_morwong: 0.4,
  blue_groper: 0.4,
  bonito: 0.36,
  cobia: 0.36,
  dusky_flathead: 0.42,
  tiger_flathead: 0.4,
  bluespotted_flathead: 0.38,
  sand_flathead: 0.36,
  rock_flathead: 0.38,
  flounder: 0.4,
  australian_salmon: 0.4,
  australian_herring: 0.26,
  albacore: 0.36,
  amberjack: 0.38,
  barramundi: 0.4,
  black_bream: 0.38,
  yellowfin_bream: 0.38,
  tarwhine: 0.34,
  black_jewfish: 0.34,
  blue_eye_trevalla: 0.36,
  mullet: 0.42,
  bream: 0.38,
  tuna: 0.36,
  spotted_mackerel: 0.38,
  tailor: 0.42,
  trevally: 0.4,
  kingfish: 0.38,
  whiting: 0.3,
  coral_trout: 0.36,
  angler_fish: 0.4,
  dragonfish: 0.32,
  fangtooth: 0.4,
  // Sharks are a deliberate exception to "modest" - their SWIM_SCALE below
  // is already huge (1.0-1.15, "unmistakable the moment one shows up"), so
  // a small bait-on-hook scale here made them visibly collapse the instant
  // they bit, then balloon back up for the catch reveal. Keeping this close
  // to their SWIM_SCALE (and REVEAL_SCALE) avoids that jarring double-shrink.
  great_white: 0.85,
  tiger_shark: 0.75,
  bull_shark: 0.78,
  megalodon: 4,
  humpback_whale: 1.3,
  old_boot: 0.55
};

// A big, celebratory scale used only for the moment-of-catch reveal at
// screen center - this is where a shark gets to look genuinely enormous.
const REVEAL_SCALE = {
  prawn: 0.9,
  flathead: 0.9,
  red_morwong: 0.85,
  banded_morwong: 0.85,
  blue_morwong: 0.85,
  hairtail: 0.75,
  hapuku: 0.9,
  leatherjacket: 0.7,
  longtail_tuna: 0.85,
  yellowfin_tuna: 0.9,
  southern_bluefin_tuna: 0.9,
  bigeye_tuna: 0.9,
  skipjack_tuna: 0.78,
  blackfin_tuna: 0.8,
  dogtooth_tuna: 0.92,
  luderick: 0.75,
  spanish_mackerel: 0.85,
  school_mackerel: 0.78,
  king_mackerel: 0.88,
  mahi_mahi: 0.92,
  mangrove_jack: 0.82,
  black_marlin: 1.2,
  blue_marlin: 1.3,
  striped_marlin: 1.1,
  white_marlin: 0.9,
  moses_perch: 0.7,
  mulloway: 0.95,
  pearl_perch: 0.85,
  pink_snapper: 0.85,
  red_snapper: 0.85,
  mangrove_snapper: 0.82,
  vermilion_snapper: 0.8,
  silk_snapper: 0.82,
  queenfish: 0.85,
  red_emperor: 0.9,
  crimson_snapper: 0.82,
  fingermark: 0.85,
  nannygai: 0.8,
  sailfish: 1.15,
  samsonfish: 0.88,
  sand_whiting: 0.65,
  school_whiting: 0.5,
  king_george_whiting: 0.7,
  yellowfin_whiting: 0.58,
  trumpeter_whiting: 0.58,
  snook: 0.85,
  teraglin: 0.85,
  wahoo: 1.05,
  dhufish: 0.88,
  baldchin_groper: 0.85,
  tuskfish: 0.82,
  blackspot_tuskfish: 0.85,
  blue_tuskfish: 0.82,
  black_sea_bass: 0.8,
  gag_grouper: 0.9,
  red_grouper: 0.88,
  black_grouper: 0.9,
  scamp: 0.85,
  warsaw_grouper: 1.1,
  red_drum: 0.85,
  black_drum: 0.9,
  spotted_seatrout: 0.8,
  weakfish: 0.8,
  tarpon: 1.05,
  bonefish: 0.78,
  permit: 0.85,
  striped_bass: 0.85,
  sheepshead: 0.85,
  hogfish: 0.85,
  florida_pompano: 0.75,
  crevalle_jack: 0.88,
  ladyfish: 0.75,
  tripletail: 0.85,
  atlantic_croaker: 0.6,
  spot: 0.5,
  pigfish: 0.6,
  white_grunt: 0.7,
  red_porgy: 0.78,
  scup: 0.55,
  tautog: 0.78,
  golden_tilefish: 0.85,
  blueline_tilefish: 0.78,
  atlantic_mackerel: 0.68,
  cero_mackerel: 0.8,
  little_tunny: 0.75,
  atlantic_bonito: 0.8,
  shortfin_mako: 1.15,
  whaler_shark: 1.0,
  bronze_whaler: 1.02,
  dusky_shark: 1.2,
  blacktip_shark: 0.95,
  spinner_shark: 0.97,
  hammerhead: 1.05,
  scalloped_hammerhead: 1.08,
  great_hammerhead: 1.35,
  wobbegong: 0.8,
  ornate_wobbegong: 0.82,
  spotted_wobbegong: 0.84,
  gummy_shark: 0.72,
  school_shark: 0.88,
  blue_shark: 1.06,
  spiny_dogfish: 0.55,
  smooth_dogfish: 0.52,
  seven_gilled_shark: 1.15,
  six_gilled_shark: 1.4,
  sawshark: 0.78,
  thresher_shark: 1.2,
  angel_shark: 0.72,
  nurse_shark: 1.0,
  lemon_shark: 1.02,
  sandbar_shark: 1.05,
  blacktip_reef_shark: 0.68,
  guitarfish: 0.85,
  shovelnose_ray: 0.86,
  eagle_ray: 0.75,
  manta_ray: 1.0,
  devil_ray: 0.78,
  stingray: 0.6,
  southern_stingray: 0.65,
  cownose_ray: 0.58,
  butterfly_ray: 0.62,
  electric_ray: 0.58,
  torpedo_ray: 0.68,
  banjo_ray: 0.55,
  fiddler_ray: 0.56,
  barndoor_skate: 0.62,
  winter_skate: 0.54,
  clearnose_skate: 0.5,
  little_skate: 0.4,
  great_barracuda: 0.75,
  pickhandle_barracuda: 0.6,
  fat_snook: 0.64,
  african_pompano: 0.7,
  lookdown: 0.46,
  southern_flounder: 0.85,
  summer_flounder: 0.85,
  garfish: 0.75,
  southern_garfish: 0.75,
  gemfish: 0.85,
  giant_trevally: 0.95,
  golden_trevally: 0.85,
  silver_trevally: 0.8,
  grey_morwong: 0.85,
  jackass_morwong: 0.85,
  blue_groper: 0.85,
  bonito: 0.85,
  cobia: 0.82,
  dusky_flathead: 0.9,
  tiger_flathead: 0.88,
  bluespotted_flathead: 0.85,
  sand_flathead: 0.8,
  rock_flathead: 0.85,
  flounder: 0.85,
  australian_salmon: 0.85,
  australian_herring: 0.6,
  albacore: 0.85,
  amberjack: 0.85,
  barramundi: 0.88,
  black_bream: 0.85,
  yellowfin_bream: 0.85,
  tarwhine: 0.8,
  black_jewfish: 0.85,
  blue_eye_trevalla: 0.85,
  mullet: 0.9,
  bream: 0.85,
  tuna: 0.75,
  spotted_mackerel: 0.85,
  tailor: 0.95,
  trevally: 0.85,
  kingfish: 0.88,
  whiting: 0.65,
  coral_trout: 0.85,
  angler_fish: 0.8,
  dragonfish: 0.7,
  fangtooth: 0.85,
  great_white: 1.3,
  tiger_shark: 1.15,
  bull_shark: 1.2,
  // Deliberately enormous - the whole point of the encounter is that it
  // fills the screen at the moment of the reveal, the one time it's ever
  // seen at all.
  megalodon: 7.5,
  // A real trophy encounter in its own right, sitting well above every
  // shark's own REVEAL_SCALE - not quite Megalodon-huge (that one's the
  // single rarest thing in the game and is never seen swimming around as
  // itself), but still an unmistakably enormous reveal.
  humpback_whale: 2.2,
  old_boot: 1.1
};

// Base swimming size and speed (world px/sec) per species, tuned by feel -
// bigger/predatory fish are a bit faster. Sharks are deliberately huge -
// same "roughly as long as the character" scale established earlier -
// unmistakable the moment one shows up, not just another fish shape.
const SWIM_SCALE = {
  flathead: 0.5,
  red_morwong: 0.42,
  banded_morwong: 0.44,
  blue_morwong: 0.46,
  hairtail: 0.4,
  hapuku: 0.52,
  leatherjacket: 0.3,
  longtail_tuna: 0.46,
  yellowfin_tuna: 0.48,
  southern_bluefin_tuna: 0.5,
  bigeye_tuna: 0.5,
  skipjack_tuna: 0.38,
  blackfin_tuna: 0.4,
  dogtooth_tuna: 0.5,
  luderick: 0.38,
  spanish_mackerel: 0.46,
  school_mackerel: 0.4,
  king_mackerel: 0.48,
  mahi_mahi: 0.5,
  mangrove_jack: 0.42,
  black_marlin: 0.85,
  blue_marlin: 0.92,
  striped_marlin: 0.78,
  white_marlin: 0.6,
  moses_perch: 0.36,
  mulloway: 0.54,
  pearl_perch: 0.46,
  pink_snapper: 0.44,
  red_snapper: 0.44,
  mangrove_snapper: 0.42,
  vermilion_snapper: 0.4,
  silk_snapper: 0.42,
  queenfish: 0.46,
  red_emperor: 0.5,
  crimson_snapper: 0.42,
  fingermark: 0.46,
  nannygai: 0.42,
  sailfish: 0.56,
  samsonfish: 0.5,
  sand_whiting: 0.34,
  school_whiting: 0.28,
  king_george_whiting: 0.36,
  yellowfin_whiting: 0.3,
  trumpeter_whiting: 0.3,
  snook: 0.46,
  teraglin: 0.44,
  wahoo: 0.4,
  dhufish: 0.46,
  baldchin_groper: 0.44,
  tuskfish: 0.4,
  blackspot_tuskfish: 0.42,
  blue_tuskfish: 0.4,
  black_sea_bass: 0.42,
  gag_grouper: 0.46,
  red_grouper: 0.44,
  black_grouper: 0.46,
  scamp: 0.42,
  warsaw_grouper: 0.56,
  red_drum: 0.44,
  black_drum: 0.48,
  spotted_seatrout: 0.4,
  weakfish: 0.4,
  tarpon: 0.5,
  bonefish: 0.44,
  permit: 0.46,
  striped_bass: 0.44,
  sheepshead: 0.42,
  hogfish: 0.42,
  florida_pompano: 0.4,
  crevalle_jack: 0.46,
  ladyfish: 0.38,
  tripletail: 0.42,
  atlantic_croaker: 0.3,
  spot: 0.26,
  pigfish: 0.3,
  white_grunt: 0.34,
  red_porgy: 0.38,
  scup: 0.28,
  tautog: 0.38,
  golden_tilefish: 0.42,
  blueline_tilefish: 0.38,
  atlantic_mackerel: 0.36,
  cero_mackerel: 0.4,
  little_tunny: 0.38,
  atlantic_bonito: 0.4,
  shortfin_mako: 0.9,
  whaler_shark: 0.8,
  bronze_whaler: 0.82,
  dusky_shark: 0.95,
  blacktip_shark: 0.72,
  spinner_shark: 0.74,
  hammerhead: 0.85,
  scalloped_hammerhead: 0.88,
  great_hammerhead: 1.05,
  wobbegong: 0.6,
  ornate_wobbegong: 0.62,
  spotted_wobbegong: 0.64,
  gummy_shark: 0.55,
  school_shark: 0.68,
  blue_shark: 0.86,
  spiny_dogfish: 0.4,
  smooth_dogfish: 0.38,
  seven_gilled_shark: 0.9,
  six_gilled_shark: 1.1,
  sawshark: 0.58,
  thresher_shark: 0.75,
  angel_shark: 0.55,
  nurse_shark: 0.78,
  lemon_shark: 0.8,
  sandbar_shark: 0.85,
  blacktip_reef_shark: 0.5,
  guitarfish: 0.55,
  shovelnose_ray: 0.56,
  eagle_ray: 0.5,
  manta_ray: 0.7,
  devil_ray: 0.55,
  stingray: 0.42,
  southern_stingray: 0.46,
  cownose_ray: 0.4,
  butterfly_ray: 0.42,
  electric_ray: 0.4,
  torpedo_ray: 0.48,
  banjo_ray: 0.38,
  fiddler_ray: 0.38,
  barndoor_skate: 0.42,
  winter_skate: 0.36,
  clearnose_skate: 0.34,
  little_skate: 0.26,
  great_barracuda: 0.5,
  pickhandle_barracuda: 0.4,
  fat_snook: 0.42,
  african_pompano: 0.44,
  lookdown: 0.3,
  southern_flounder: 0.42,
  summer_flounder: 0.4,
  garfish: 0.34,
  southern_garfish: 0.32,
  gemfish: 0.42,
  giant_trevally: 0.56,
  golden_trevally: 0.46,
  silver_trevally: 0.44,
  grey_morwong: 0.44,
  jackass_morwong: 0.42,
  blue_groper: 0.48,
  bonito: 0.44,
  cobia: 0.5,
  dusky_flathead: 0.5,
  tiger_flathead: 0.46,
  bluespotted_flathead: 0.44,
  sand_flathead: 0.38,
  rock_flathead: 0.44,
  flounder: 0.42,
  australian_salmon: 0.48,
  australian_herring: 0.32,
  albacore: 0.46,
  amberjack: 0.48,
  barramundi: 0.5,
  black_bream: 0.42,
  yellowfin_bream: 0.42,
  tarwhine: 0.4,
  black_jewfish: 0.52,
  blue_eye_trevalla: 0.48,
  mullet: 0.5,
  bream: 0.48,
  tuna: 0.42,
  spotted_mackerel: 0.44,
  tailor: 0.5,
  trevally: 0.46,
  kingfish: 0.5,
  whiting: 0.36,
  coral_trout: 0.5,
  angler_fish: 0.44,
  dragonfish: 0.34,
  fangtooth: 0.4,
  great_white: 1.15,
  tiger_shark: 1.0,
  bull_shark: 1.05,
  // Bigger on-screen than any shark - a real humpback dwarfs every other
  // swimmer in the game (Megalodon aside, which never actually swims
  // around as itself).
  humpback_whale: 1.8,
  old_boot: 0.5
};
const SWIM_SPEED = {
  flathead: 40,
  red_morwong: 28,
  banded_morwong: 28,
  blue_morwong: 32,
  hairtail: 46,
  hapuku: 26,
  leatherjacket: 24,
  longtail_tuna: 56,
  yellowfin_tuna: 54,
  southern_bluefin_tuna: 50,
  bigeye_tuna: 54,
  skipjack_tuna: 58,
  blackfin_tuna: 56,
  dogtooth_tuna: 48,
  luderick: 26,
  spanish_mackerel: 58,
  school_mackerel: 52,
  king_mackerel: 56,
  mahi_mahi: 52,
  mangrove_jack: 36,
  black_marlin: 60,
  blue_marlin: 66,
  striped_marlin: 70,
  white_marlin: 62,
  moses_perch: 24,
  mulloway: 32,
  pearl_perch: 26,
  pink_snapper: 30,
  red_snapper: 30,
  mangrove_snapper: 32,
  vermilion_snapper: 30,
  silk_snapper: 28,
  queenfish: 56,
  red_emperor: 34,
  crimson_snapper: 28,
  fingermark: 34,
  nannygai: 24,
  // The fastest fish in the game, by design - a real sailfish is the
  // single fastest fish in the ocean.
  sailfish: 72,
  samsonfish: 44,
  sand_whiting: 26,
  school_whiting: 24,
  king_george_whiting: 26,
  yellowfin_whiting: 24,
  trumpeter_whiting: 24,
  snook: 46,
  teraglin: 32,
  // Second only to the Sailfish - a real Wahoo is one of the very
  // fastest fish in the ocean.
  wahoo: 66,
  dhufish: 26,
  baldchin_groper: 30,
  tuskfish: 28,
  blackspot_tuskfish: 28,
  blue_tuskfish: 28,
  black_sea_bass: 26,
  gag_grouper: 30,
  red_grouper: 28,
  black_grouper: 28,
  scamp: 32,
  warsaw_grouper: 22,
  red_drum: 34,
  black_drum: 26,
  spotted_seatrout: 34,
  weakfish: 34,
  tarpon: 40,
  bonefish: 56,
  permit: 38,
  striped_bass: 34,
  sheepshead: 24,
  hogfish: 26,
  florida_pompano: 36,
  crevalle_jack: 44,
  ladyfish: 42,
  tripletail: 20,
  atlantic_croaker: 22,
  spot: 20,
  pigfish: 22,
  white_grunt: 26,
  red_porgy: 24,
  scup: 22,
  tautog: 20,
  golden_tilefish: 22,
  blueline_tilefish: 24,
  atlantic_mackerel: 48,
  cero_mackerel: 56,
  little_tunny: 58,
  atlantic_bonito: 58,
  shortfin_mako: 50,
  whaler_shark: 34,
  bronze_whaler: 36,
  dusky_shark: 32,
  blacktip_shark: 38,
  spinner_shark: 40,
  hammerhead: 34,
  scalloped_hammerhead: 34,
  great_hammerhead: 32,
  wobbegong: 14,
  ornate_wobbegong: 14,
  spotted_wobbegong: 14,
  gummy_shark: 22,
  school_shark: 26,
  blue_shark: 42,
  spiny_dogfish: 20,
  smooth_dogfish: 20,
  seven_gilled_shark: 24,
  six_gilled_shark: 22,
  sawshark: 24,
  thresher_shark: 40,
  angel_shark: 14,
  nurse_shark: 16,
  lemon_shark: 30,
  sandbar_shark: 32,
  blacktip_reef_shark: 38,
  guitarfish: 22,
  shovelnose_ray: 20,
  eagle_ray: 34,
  manta_ray: 30,
  devil_ray: 32,
  stingray: 18,
  southern_stingray: 20,
  cownose_ray: 26,
  butterfly_ray: 16,
  electric_ray: 12,
  // Looks like a plain Stingray (see tackle.js) but noticeably faster in
  // the water - roughly double the Stingray's own speed, not just a
  // recolor with the same swim feel.
  torpedo_ray: 34,
  banjo_ray: 18,
  fiddler_ray: 18,
  barndoor_skate: 18,
  winter_skate: 16,
  clearnose_skate: 18,
  little_skate: 16,
  great_barracuda: 52,
  pickhandle_barracuda: 54,
  fat_snook: 38,
  african_pompano: 42,
  lookdown: 36,
  southern_flounder: 22,
  summer_flounder: 26,
  garfish: 50,
  southern_garfish: 50,
  gemfish: 54,
  giant_trevally: 50,
  golden_trevally: 40,
  silver_trevally: 42,
  grey_morwong: 30,
  jackass_morwong: 30,
  blue_groper: 34,
  bonito: 56,
  cobia: 44,
  dusky_flathead: 30,
  tiger_flathead: 32,
  bluespotted_flathead: 30,
  sand_flathead: 28,
  rock_flathead: 28,
  flounder: 24,
  australian_salmon: 55,
  australian_herring: 42,
  albacore: 58,
  amberjack: 50,
  barramundi: 46,
  black_bream: 40,
  yellowfin_bream: 40,
  tarwhine: 38,
  black_jewfish: 34,
  blue_eye_trevalla: 30,
  mullet: 45,
  bream: 42,
  tuna: 50,
  spotted_mackerel: 58,
  tailor: 60,
  trevally: 55,
  kingfish: 58,
  whiting: 38,
  coral_trout: 32,
  angler_fish: 16,
  dragonfish: 18,
  fangtooth: 14,
  great_white: 48,
  tiger_shark: 52,
  bull_shark: 46,
  // Slower and more deliberate than any shark - a real humpback is a
  // powerful swimmer but not a sprinter, and its sheer bulk should read as
  // unhurried rather than darting.
  humpback_whale: 24,
  old_boot: 18
};

// Every regular fish spawns evenly from this pool (no Seaweed anymore),
// filtered per-spawn by DEPTH_LIMITS below.
const NORMAL_POOL = [
  'flathead',
  'red_morwong',
  'banded_morwong',
  'blue_morwong',
  'hairtail',
  'hapuku',
  'leatherjacket',
  'longtail_tuna',
  'yellowfin_tuna',
  'southern_bluefin_tuna',
  'bigeye_tuna',
  'skipjack_tuna',
  'blackfin_tuna',
  'dogtooth_tuna',
  'luderick',
  'spanish_mackerel',
  'school_mackerel',
  'king_mackerel',
  'mahi_mahi',
  'mangrove_jack',
  'black_marlin',
  'blue_marlin',
  'striped_marlin',
  'white_marlin',
  'moses_perch',
  'mulloway',
  'pearl_perch',
  'pink_snapper',
  'red_snapper',
  'mangrove_snapper',
  'vermilion_snapper',
  'silk_snapper',
  'queenfish',
  'red_emperor',
  'crimson_snapper',
  'fingermark',
  'nannygai',
  'sailfish',
  'samsonfish',
  'sand_whiting',
  'school_whiting',
  'king_george_whiting',
  'yellowfin_whiting',
  'trumpeter_whiting',
  'snook',
  'teraglin',
  'wahoo',
  'dhufish',
  'baldchin_groper',
  'tuskfish',
  'blackspot_tuskfish',
  'blue_tuskfish',
  'black_sea_bass',
  'gag_grouper',
  'red_grouper',
  'black_grouper',
  'scamp',
  'warsaw_grouper',
  'red_drum',
  'black_drum',
  'spotted_seatrout',
  'weakfish',
  'tarpon',
  'bonefish',
  'permit',
  'striped_bass',
  'sheepshead',
  'hogfish',
  'florida_pompano',
  'crevalle_jack',
  'ladyfish',
  'tripletail',
  'atlantic_croaker',
  'spot',
  'pigfish',
  'white_grunt',
  'red_porgy',
  'scup',
  'tautog',
  'golden_tilefish',
  'blueline_tilefish',
  'atlantic_mackerel',
  'cero_mackerel',
  'little_tunny',
  'atlantic_bonito',
  'southern_flounder',
  'summer_flounder',
  'garfish',
  'southern_garfish',
  'gemfish',
  'giant_trevally',
  'golden_trevally',
  'silver_trevally',
  'grey_morwong',
  'jackass_morwong',
  'blue_groper',
  'bonito',
  'cobia',
  'dusky_flathead',
  'tiger_flathead',
  'bluespotted_flathead',
  'sand_flathead',
  'rock_flathead',
  'flounder',
  'australian_salmon',
  'australian_herring',
  'albacore',
  'amberjack',
  'barramundi',
  'black_bream',
  'yellowfin_bream',
  'tarwhine',
  'black_jewfish',
  'blue_eye_trevalla',
  'mullet',
  'bream',
  'tuna',
  'spotted_mackerel',
  'tailor',
  'trevally',
  'kingfish',
  'whiting',
  'coral_trout',
  'angler_fish',
  'dragonfish',
  'fangtooth',
  'barndoor_skate',
  'winter_skate',
  'clearnose_skate',
  'little_skate',
  'great_barracuda',
  'pickhandle_barracuda',
  'fat_snook',
  'african_pompano',
  'lookdown',
  'old_boot'
];
// Depth (world px, 12px = 1m) restrictions on individual NORMAL_POOL
// entries - checked against the hook's current depth every spawn roll.
// Coral Trout only turns up from 200m down; Hapuku is a real deep-dwelling
// wreckfish and only turns up from 100m; Blue-eye Trevalla is a real
// continental-shelf deep-dropper species and only turns up from 600m; the
// Dragonfish is a real deep-sea species and only turns up from 1500m; the
// Angler Fish only turns up from a genuinely abyssal 4000m down; the Boot
// only turns up above 150m (junk washing around near the surface, not down
// in open water).
const DEPTH_LIMITS = {
  hapuku: { min: 1200 },
  coral_trout: { min: 2400 },
  // A real deep-water giant grouper - sits between the Coral Trout's
  // reef depth and the Blue-eye Trevalla's own continental-shelf range.
  warsaw_grouper: { min: 3600 },
  // Real deep-drop tilefish - Blueline sits shallower than the Golden's
  // own deeper preferred range, both still below any reef species.
  blueline_tilefish: { min: 3000 },
  golden_tilefish: { min: 4800 },
  blue_eye_trevalla: { min: 7200 },
  // A real deep-sea dragonfish - sits between the Blue-eye Trevalla's
  // continental-shelf 600m and the Angler Fish's abyssal 4000m.
  dragonfish: { min: 18000 },
  // A real fangtooth - sits between the Dragonfish's 1500m and the
  // Angler Fish's abyssal 4000m.
  fangtooth: { min: 24000 },
  angler_fish: { min: 48000 },
  old_boot: { max: 1800 }
};

// The deep-drop/deep-sea end of NORMAL_POOL - real species that only ever
// turn up from a genuine depth (see their own DEPTH_LIMITS above), not the
// shallower reef ones like Coral Trout or Hapuku. Abyssal Bait (see
// pickSpawnId) blows straight through their depth gate and boosts them
// hard on top of that - "come up from anywhere, and come up often" is the
// entire point of fishing with it.
const ABYSS_FISH = ['warsaw_grouper', 'blueline_tilefish', 'golden_tilefish', 'blue_eye_trevalla', 'dragonfish', 'fangtooth', 'angler_fish'];
const ABYSS_BOOST_COPIES = 3;

// Every NORMAL_POOL species that's Legendary tier by value rank (see
// rarityTierFor) - computed once here rather than hand-picked, so it
// tracks the same ranking the Index/Bag/Sell screens already colour-code
// by. Sharks and rays are Legendary too, but they're gated by their own
// specific realistic bait (SHARK_BAIT/RAY_BAIT) and untouched here -
// this only ever nudges the ones that spawn through the normal pool.
const NORMAL_POOL_LEGENDARY = NORMAL_POOL.filter((id) => rarityTierFor(id) === 'legendary');

// The 15 physically biggest NORMAL_POOL species by their own baseWeightKg
// (fishData.js) - a different axis entirely from NORMAL_POOL_LEGENDARY's
// value rank (a fish can be huge without being especially valuable per
// kilo, or vice versa). Colossal Bait (see pickSpawnId) boosts these
// hard - "big bait catches big fish" is the entire point of fishing
// with it, not a value-rank nudge like the other crate rewards.
const NORMAL_POOL_BIG = NORMAL_POOL.slice()
  .filter((id) => id !== 'old_boot')
  .sort((a, b) => getCatchable(b).baseWeightKg - getCatchable(a).baseWeightKg)
  .slice(0, 15);
const COLOSSAL_BOOST_COPIES = 3;
// Sharks only ever get rolled for when the equipped bait is one of their
// own realistic prey species, and only once the hook is past
// SHARK_MIN_DEPTH - which sits below the starting line's own max reach
// entirely, so a shark genuinely can't turn up until at least one line
// upgrade has been bought - and even then it's a long shot. No generic
// "any large fish might hook any shark" fallback anymore - each shark has
// its own list, based on what it actually eats:
//  - Great White: big, fatty pelagic fish, and opportunistically smaller
//    sharks.
//  - Tiger Shark: a famous indiscriminate generalist ("the wastebasket of
//    the sea") - the broadest list of the three.
//  - Bull Shark: an opportunistic estuarine/inshore hunter, so it answers
//    to the inshore/estuary species (Barramundi, Black Jewfish, Australian
//    Herring) as well as open-water fish that pass through bays.
// Odds are the same ones each shark always had (0.08/0.14/0.12), still cut
// to a third since bait is no longer the sole gate on triggering the roll.
const SHARK_BAIT = {
  great_white: {
    baits: [
      'tuna',
      'australian_salmon',
      'kingfish',
      'albacore',
      'amberjack',
      'cobia',
      'bonito',
      'giant_trevally',
      'gemfish',
      'longtail_tuna',
      'yellowfin_tuna',
      'southern_bluefin_tuna',
      'bigeye_tuna',
      'dogtooth_tuna',
      'mahi_mahi',
      'king_mackerel',
      'hapuku',
      'black_marlin',
      'blue_marlin',
      'striped_marlin',
      'white_marlin',
      'sailfish',
      'samsonfish',
      'wahoo',
      'dhufish',
      'gag_grouper',
      'red_grouper',
      'black_grouper',
      'warsaw_grouper',
      'tarpon',
      'crevalle_jack',
      'little_tunny',
      'atlantic_bonito',
      'shortfin_mako',
      'whaler_shark',
      'bronze_whaler',
      'dusky_shark',
      'hammerhead',
      'scalloped_hammerhead',
      'blue_shark',
      'gummy_shark',
      'school_shark',
      'great_barracuda',
      'african_pompano',
      'tiger_shark',
      'bull_shark'
    ],
    chance: 0.08 / 3
  },
  tiger_shark: {
    baits: [
      'tuna',
      'australian_salmon',
      'kingfish',
      'coral_trout',
      'spotted_mackerel',
      'trevally',
      'albacore',
      'amberjack',
      'barramundi',
      'black_jewfish',
      'blue_eye_trevalla',
      'cobia',
      'bonito',
      'giant_trevally',
      'golden_trevally',
      'silver_trevally',
      'gemfish',
      'grey_morwong',
      'jackass_morwong',
      'red_morwong',
      'banded_morwong',
      'blue_morwong',
      'hairtail',
      'hapuku',
      'leatherjacket',
      'longtail_tuna',
      'yellowfin_tuna',
      'southern_bluefin_tuna',
      'bigeye_tuna',
      'skipjack_tuna',
      'blackfin_tuna',
      'dogtooth_tuna',
      'spanish_mackerel',
      'school_mackerel',
      'king_mackerel',
      'mahi_mahi',
      'mangrove_jack',
      'black_marlin',
      'blue_marlin',
      'striped_marlin',
      'white_marlin',
      'mulloway',
      'pearl_perch',
      'pink_snapper',
      'red_snapper',
      'mangrove_snapper',
      'moses_perch',
      'vermilion_snapper',
      'silk_snapper',
      'queenfish',
      'red_emperor',
      'crimson_snapper',
      'fingermark',
      'nannygai',
      'sailfish',
      'samsonfish',
      'snook',
      'teraglin',
      'wahoo',
      'sand_whiting',
      'school_whiting',
      'king_george_whiting',
      'yellowfin_whiting',
      'trumpeter_whiting',
      'dhufish',
      'baldchin_groper',
      'tuskfish',
      'blackspot_tuskfish',
      'blue_tuskfish',
      'black_sea_bass',
      'gag_grouper',
      'red_grouper',
      'black_grouper',
      'scamp',
      'warsaw_grouper',
      'red_drum',
      'black_drum',
      'spotted_seatrout',
      'weakfish',
      'tarpon',
      'bonefish',
      'permit',
      'striped_bass',
      'sheepshead',
      'hogfish',
      'florida_pompano',
      'crevalle_jack',
      'ladyfish',
      'tripletail',
      'golden_tilefish',
      'blueline_tilefish',
      'atlantic_mackerel',
      'cero_mackerel',
      'little_tunny',
      'atlantic_bonito',
      'tautog',
      'shortfin_mako',
      'whaler_shark',
      'bronze_whaler',
      'dusky_shark',
      'blacktip_shark',
      'spinner_shark',
      'hammerhead',
      'scalloped_hammerhead',
      'wobbegong',
      'gummy_shark',
      'school_shark',
      'blue_shark',
      'spiny_dogfish',
      'smooth_dogfish',
      'sawshark',
      'great_barracuda',
      'pickhandle_barracuda',
      'fat_snook',
      'african_pompano',
      'lookdown',
      'barndoor_skate',
      'winter_skate',
      'clearnose_skate',
      'little_skate',
      'bull_shark'
    ],
    chance: 0.14 / 3
  },
  bull_shark: {
    baits: [
      'trevally',
      'spotted_mackerel',
      'mullet',
      'kingfish',
      'australian_salmon',
      'barramundi',
      'black_jewfish',
      'australian_herring',
      'cobia',
      'bonito',
      'golden_trevally',
      'silver_trevally',
      'garfish',
      'southern_garfish',
      'hairtail',
      'leatherjacket',
      'luderick',
      'mangrove_jack',
      'school_mackerel',
      'mulloway',
      'mangrove_snapper',
      'moses_perch',
      'queenfish',
      'fingermark',
      'crimson_snapper',
      'snook',
      'teraglin',
      'sand_whiting',
      'school_whiting',
      'king_george_whiting',
      'yellowfin_whiting',
      'trumpeter_whiting',
      'red_drum',
      'black_drum',
      'spotted_seatrout',
      'weakfish',
      'bonefish',
      'permit',
      'striped_bass',
      'sheepshead',
      'florida_pompano',
      'crevalle_jack',
      'ladyfish',
      'tripletail',
      'atlantic_croaker',
      'spot',
      'pigfish',
      'white_grunt',
      'scup',
      'wobbegong',
      'ornate_wobbegong',
      'spotted_wobbegong',
      'gummy_shark',
      'school_shark',
      'spiny_dogfish',
      'smooth_dogfish',
      'sawshark',
      'pickhandle_barracuda',
      'fat_snook',
      'lookdown',
      'clearnose_skate',
      'little_skate'
    ],
    chance: 0.12 / 3
  },
  // The 20 sharks below all work exactly like the three above - gated on
  // realistic prey as bait, never spawning through the normal pool. Their
  // chance values are tiered the same way their own rarity in fishData.js
  // is: legendary = 0.08/3 (matching the Great White), rare = 0.11/3,
  // uncommon = 0.14/3 (matching the Tiger Shark), common = 0.18/3.
  shortfin_mako: {
    // The fastest shark there is - a real open-ocean hunter of fast
    // pelagic fish: tuna, mackerel, billfish, and smaller sharks.
    baits: [
      'tuna',
      'longtail_tuna',
      'yellowfin_tuna',
      'southern_bluefin_tuna',
      'bigeye_tuna',
      'skipjack_tuna',
      'blackfin_tuna',
      'dogtooth_tuna',
      'little_tunny',
      'bonito',
      'atlantic_bonito',
      'albacore',
      'spanish_mackerel',
      'king_mackerel',
      'atlantic_mackerel',
      'cero_mackerel',
      'wahoo',
      'mahi_mahi',
      'sailfish',
      'black_marlin',
      'blue_marlin',
      'striped_marlin',
      'white_marlin',
      'kingfish',
      'amberjack'
    ],
    chance: 0.08 / 3
  },
  whaler_shark: {
    // A real broad, opportunistic requiem shark - a notch less
    // indiscriminate than the Tiger Shark, but still a wide-ranging
    // generalist.
    baits: [
      'tailor',
      'australian_salmon',
      'mullet',
      'trevally',
      'giant_trevally',
      'golden_trevally',
      'silver_trevally',
      'kingfish',
      'cobia',
      'bonito',
      'tuna',
      'garfish',
      'southern_garfish',
      'whiting',
      'luderick',
      'flathead',
      'bream',
      'black_bream',
      'yellowfin_bream'
    ],
    chance: 0.14 / 3
  },
  bronze_whaler: {
    // A real specialist on the big schooling baitfish runs - salmon,
    // tailor, mullet - that draw it inshore.
    baits: [
      'australian_salmon',
      'tailor',
      'mullet',
      'australian_herring',
      'garfish',
      'southern_garfish',
      'silver_trevally',
      'trevally',
      'whiting',
      'sand_whiting',
      'school_whiting'
    ],
    chance: 0.14 / 3
  },
  dusky_shark: {
    // A real big, broad-spectrum predator - fish, smaller sharks, and
    // rays, though only fish and sharks are represented here.
    baits: [
      'tuna',
      'longtail_tuna',
      'kingfish',
      'cobia',
      'amberjack',
      'samsonfish',
      'trevally',
      'giant_trevally',
      'spanish_mackerel',
      'king_mackerel',
      'mulloway',
      'gummy_shark',
      'school_shark',
      'wobbegong'
    ],
    chance: 0.11 / 3
  },
  blacktip_shark: {
    // A real inshore specialist on small, fast schooling baitfish.
    baits: [
      'mullet',
      'australian_herring',
      'garfish',
      'southern_garfish',
      'spanish_mackerel',
      'school_mackerel',
      'atlantic_mackerel',
      'sand_whiting',
      'school_whiting',
      'ladyfish',
      'spot',
      'pigfish'
    ],
    chance: 0.14 / 3
  },
  spinner_shark: {
    // A real close relative of the Blacktip's own diet, mackerel-heavy.
    baits: [
      'mullet',
      'australian_herring',
      'spanish_mackerel',
      'cero_mackerel',
      'atlantic_mackerel',
      'garfish',
      'ladyfish',
      'spot',
      'pigfish',
      'atlantic_croaker',
      'little_tunny'
    ],
    chance: 0.14 / 3
  },
  hammerhead: {
    // The plain baseline hammerhead - real hammerheads are famous
    // crustacean/ray hunters, so the crunch-jawed Tuskfish family stands
    // in here alongside ordinary reef and inshore fish.
    baits: [
      'whiting',
      'sand_whiting',
      'school_whiting',
      'trevally',
      'silver_trevally',
      'flathead',
      'tuskfish',
      'blackspot_tuskfish',
      'blue_tuskfish',
      'gummy_shark',
      'school_shark',
      'wobbegong'
    ],
    chance: 0.14 / 3
  },
  scalloped_hammerhead: {
    // A real schooling reef-associated hammerhead.
    baits: [
      'trevally',
      'silver_trevally',
      'golden_trevally',
      'red_snapper',
      'mangrove_snapper',
      'crimson_snapper',
      'fingermark',
      'spanish_mackerel',
      'school_mackerel',
      'whiting',
      'coral_trout'
    ],
    chance: 0.11 / 3
  },
  great_hammerhead: {
    // The largest hammerhead there is - real Great Hammerheads are
    // famous for hunting other sharks, rays, and big fish.
    baits: [
      'gummy_shark',
      'school_shark',
      'wobbegong',
      'ornate_wobbegong',
      'spotted_wobbegong',
      'sawshark',
      'kingfish',
      'trevally',
      'giant_trevally',
      'tarpon',
      'cobia',
      'mangrove_jack'
    ],
    chance: 0.08 / 3
  },
  wobbegong: {
    // A real flat ambush predator on small reef fish it lies in wait
    // for, camouflaged against the bottom.
    baits: ['whiting', 'sand_whiting', 'school_whiting', 'garfish', 'southern_garfish', 'leatherjacket', 'red_morwong', 'scup', 'spot'],
    chance: 0.18 / 3
  },
  ornate_wobbegong: {
    // The same ambush diet as the Wobbegong, on a different mix of
    // small reef fish.
    baits: ['yellowfin_whiting', 'trumpeter_whiting', 'king_george_whiting', 'atlantic_croaker', 'pigfish', 'banded_morwong', 'blue_morwong'],
    chance: 0.14 / 3
  },
  spotted_wobbegong: {
    // The same ambush diet again, on its own mix of small reef fish.
    baits: ['whiting', 'garfish', 'southern_garfish', 'leatherjacket', 'red_morwong', 'grey_morwong', 'jackass_morwong'],
    chance: 0.14 / 3
  },
  gummy_shark: {
    // A real harmless small-fish and crustacean hunter, common well
    // inshore.
    baits: ['whiting', 'sand_whiting', 'school_whiting', 'garfish', 'southern_garfish', 'flathead', 'sand_flathead', 'rock_flathead'],
    chance: 0.18 / 3
  },
  school_shark: {
    // A real small-schooling-fish hunter, prized as a table fish.
    baits: ['mullet', 'australian_herring', 'garfish', 'southern_garfish', 'whiting', 'silver_trevally', 'tailor'],
    chance: 0.18 / 3
  },
  blue_shark: {
    // A real open-ocean hunter of fast small pelagic fish.
    baits: [
      'spanish_mackerel',
      'school_mackerel',
      'atlantic_mackerel',
      'cero_mackerel',
      'mullet',
      'australian_herring',
      'little_tunny',
      'skipjack_tuna',
      'garfish'
    ],
    chance: 0.11 / 3
  },
  spiny_dogfish: {
    // A real small shark hunting small fish and crustaceans.
    baits: ['whiting', 'garfish', 'southern_garfish', 'australian_herring', 'atlantic_mackerel', 'spot', 'pigfish'],
    chance: 0.18 / 3
  },
  smooth_dogfish: {
    // The same small-fish-and-crustacean diet as the Spiny Dogfish.
    baits: ['whiting', 'garfish', 'spot', 'pigfish', 'atlantic_croaker', 'scup'],
    chance: 0.18 / 3
  },
  seven_gilled_shark: {
    // A real ancient, broad-diet predator that also hunts smaller
    // sharks.
    baits: ['gummy_shark', 'school_shark', 'wobbegong', 'ornate_wobbegong', 'spotted_wobbegong', 'tautog', 'sheepshead', 'black_drum', 'sawshark'],
    chance: 0.11 / 3
  },
  six_gilled_shark: {
    // A real ancient deep-water giant - kept behind its own much deeper
    // minDepth on top of the shared SHARK_MIN_DEPTH, and hunting the
    // other genuinely deep-water species here.
    baits: ['blue_eye_trevalla', 'angler_fish', 'warsaw_grouper', 'golden_tilefish', 'blueline_tilefish', 'hapuku', 'gummy_shark', 'school_shark'],
    chance: 0.08 / 3,
    minDepth: 6000
  },
  sawshark: {
    // A real small-fish hunter that slashes through baitfish schools
    // with its saw.
    baits: ['garfish', 'southern_garfish', 'whiting', 'mullet', 'australian_herring', 'spot', 'pigfish'],
    chance: 0.14 / 3
  },
  thresher_shark: {
    // A real open-ocean hunter of schooling baitfish, which it stuns
    // with its own famous tail.
    baits: [
      'spanish_mackerel',
      'school_mackerel',
      'king_mackerel',
      'atlantic_mackerel',
      'cero_mackerel',
      'australian_herring',
      'mullet',
      'garfish',
      'little_tunny',
      'skipjack_tuna'
    ],
    chance: 0.08 / 3
  },
  angel_shark: {
    // A real ambush predator on bottom-dwelling flatfish and small
    // inshore fish.
    baits: ['flounder', 'southern_flounder', 'summer_flounder', 'whiting', 'sand_whiting', 'flathead', 'sand_flathead', 'rock_flathead'],
    chance: 0.14 / 3
  },
  nurse_shark: {
    // A real slow, docile bottom feeder on small fish and crustaceans.
    baits: ['whiting', 'garfish', 'southern_garfish', 'spot', 'pigfish', 'atlantic_croaker', 'scup'],
    chance: 0.18 / 3
  },
  lemon_shark: {
    // A real shallow coastal and mangrove predator on inshore fish.
    baits: ['mullet', 'mangrove_jack', 'mangrove_snapper', 'snook', 'tarpon', 'ladyfish', 'crevalle_jack', 'sheepshead'],
    chance: 0.11 / 3
  },
  sandbar_shark: {
    // A real broad bottom-and-midwater hunter, including smaller
    // sharks.
    baits: ['whiting', 'flathead', 'bream', 'black_bream', 'gummy_shark', 'school_shark', 'trevally', 'silver_trevally'],
    chance: 0.14 / 3
  },
  blacktip_reef_shark: {
    // A real small reef-flat hunter of small reef fish.
    baits: ['whiting', 'sand_whiting', 'garfish', 'tuskfish', 'blackspot_tuskfish', 'moses_perch', 'fingermark'],
    chance: 0.18 / 3
  }
};
const SHARK_MIN_DEPTH = 1000;

// Rays work on a genuinely different gate from the sharks above: not one
// realistic prey species each, but the same two STACKABLE baits every
// ray answers to - real rays are mostly crustacean/mollusc feeders, so
// Squid (standing in for that) is their real draw, and Prawn only very
// occasionally tempts one in. No caught-fish-as-bait ever triggers a
// ray, and there's no shared minimum depth the way SHARK_MIN_DEPTH gates
// every shark - rays turn up at any depth once the right bait's on.
const RAY_BAIT = {
  guitarfish: { squidChance: 0.16 / 3, prawnChance: 0.02 / 3 },
  shovelnose_ray: { squidChance: 0.16 / 3, prawnChance: 0.02 / 3 },
  eagle_ray: { squidChance: 0.13 / 3, prawnChance: 0.02 / 3 },
  // The rarest ray by far, to match it being the single most valuable one
  // in the pool - roughly a fifth of its old already-lowest chance.
  manta_ray: { squidChance: 0.008 / 3, prawnChance: 0.0008 / 3 },
  devil_ray: { squidChance: 0.08 / 3, prawnChance: 0.01 / 3 },
  stingray: { squidChance: 0.2 / 3, prawnChance: 0.03 / 3 },
  southern_stingray: { squidChance: 0.16 / 3, prawnChance: 0.025 / 3 },
  cownose_ray: { squidChance: 0.13 / 3, prawnChance: 0.02 / 3 },
  butterfly_ray: { squidChance: 0.15 / 3, prawnChance: 0.02 / 3 },
  electric_ray: { squidChance: 0.11 / 3, prawnChance: 0.015 / 3 },
  torpedo_ray: { squidChance: 0.08 / 3, prawnChance: 0.01 / 3 },
  banjo_ray: { squidChance: 0.15 / 3, prawnChance: 0.02 / 3 },
  fiddler_ray: { squidChance: 0.15 / 3, prawnChance: 0.02 / 3 }
};
// A Humpback Whale answers to the same real prey/bycatch a real one
// actually feeds on out in open water: the same two stackable baits the
// rays answer to (Squid/Prawn), plus Australian Salmon and every Mackerel
// species as small schooling fish it lunge-feeds on. No depth gate, same
// as the rays - it's the bait that matters, not how deep the hook is. Kept
// deliberately below even the Manta Ray's own already-lowest chance in the
// pool (see RAY_BAIT above) - a genuine once-in-a-great-while encounter.
const WHALE_BAIT = [
  'squid',
  'prawn',
  'australian_salmon',
  'spotted_mackerel',
  'spanish_mackerel',
  'school_mackerel',
  'king_mackerel',
  'atlantic_mackerel',
  'cero_mackerel',
  'abyssal_bait',
  'chum_bait',
  'plastic_lure',
  'colossal_bait',
  'shimmering_lure',
  'deep_sea_bait'
];
const WHALE_CHANCE = 0.001;
// A graduated ladder of slight bumps over the baseline above - none of
// the six Bait Crate rewards (see baitData.js) unlock the Whale outright
// (it was already reachable on Squid/Prawn/Salmon/Mackerel), they just
// nudge the odds up a little further each, on top of everything else
// each bait already does (see ABYSS_FISH/NORMAL_POOL_LEGENDARY/
// NORMAL_POOL_BIG below), in the same order as their own crate tier
// (Uncommon < Rare < Epic < Legendary < Mythic): Deep Sea Bait the
// tiniest bump, Plastic Lure a proper step up, Colossal Bait more still
// (the Whale is the single biggest thing a line can catch, right in its
// own wheelhouse), Shimmering Lure more again, and the two Mythic
// rewards (Abyssal Bait, Chum Bait) the most, tied - each Mythic in its
// own different specialty, not one strictly better than the other.
const WHALE_CHANCE_DEEP_SEA = 0.00105;
const WHALE_CHANCE_LURE = 0.0011;
const WHALE_CHANCE_COLOSSAL = 0.00115;
const WHALE_CHANCE_SHIMMERING = 0.0012;
const WHALE_CHANCE_ABYSSAL = 0.0013;
const WHALE_CHANCE_CHUM = 0.0013;

// Not part of the spawn roll at all - a Megalodon never swims around as
// itself. Instead, right as one of the three real sharks above actually
// bites (see updateSwimmers) at least this deep, there's this tiny chance
// the catch turns out to be a Megalodon instead - "a shark was on the hook,
// this far down" is the precondition, not a separate encounter, and it's
// kept deliberately far rarer than any individual shark's own spawn chance.
const MEGALODON_CHANCE = 0.01;
const MEGALODON_MIN_DEPTH = 6000; // 500m

const WATERLINE_Y = 340; // matches TitleScene, so the dive starts from the identical framing
const SKY_COLOR = 0x9fd9f0;
const SURFACE_WATER_COLOR = 0x3fa9e0;
const DEEP_WATER_COLOR = 0x041423;
const DIVE_TARGET_SCROLL = 420; // how far the camera sinks before "fully submerged"

const HOOK_FOLLOW_EASE = 0.22;
const CAMERA_FOLLOW_EASE = 0.06;
const CAMERA_VIEW_OFFSET = 0.35;
const WHEEL_DEPTH_FACTOR = 0.6;

// Regular fish flee a hook moving faster than this (world px/frame-ish);
// sharks and the Boot ignore this entirely - a shark isn't spooked by
// thrashing bait, and junk isn't alive to be scared at all.
const FLEE_SPEED_THRESHOLD = 5.5;
const FLEE_RADIUS = 130;
const ATTRACT_RADIUS = 170;
const STILL_ATTRACT_RADIUS = 55;
const CATCH_RADIUS = 26;
const CALM_SPEED = 1.5;
const STILL_SPEED = 0.4;
// ~0.006 used to work out to roughly a 30%-per-second bite chance with no
// bait at all - nearly as fast as fishing with bait, which made bait feel
// pointless. This is tuned to a much rarer "got lucky" bite instead (~6%/sec).
const STILL_BITE_CHANCE_PER_TICK = 0.001;
const BOOT_ATTACH_CHANCE_PER_TICK = 0.01;

const MAX_FISH = 6;
const SPAWN_MIN_MS = 1400;
const SPAWN_MAX_MS = 2800;

// The hook reels straight up off the top of the screen once something's
// caught - depthPx away, so the trip is quick from shallow water and still
// stays bounded (never "20 years") from deep water, since the clamp caps it.
const REEL_UP_MIN_MS = 400;
const REEL_UP_MAX_MS = 2200;
const REEL_UP_MS_PER_PX = 0.4;
const HOOK_DROP_MS = 700;

function lerpColor(colorA, colorB, t) {
  const a = Phaser.Display.Color.IntegerToColor(colorA);
  const b = Phaser.Display.Color.IntegerToColor(colorB);
  const r = Math.round(a.red + (b.red - a.red) * t);
  const g = Math.round(a.green + (b.green - a.green) * t);
  const bl = Math.round(a.blue + (b.blue - a.blue) * t);
  return Phaser.Display.Color.GetColor(r, g, bl);
}

// Real open water stays basically the same bright blue for a long stretch
// before gradually dimming - not a rapid fade over your whole reachable
// depth. Uses a fixed absolute depth curve (not relative to how deep your
// current line can reach), so buying a longer line doesn't change how
// deep "still bright" or "fully dark" actually are.
const TINT_PLATEAU_PX = 700; // ~58m - stays essentially surface-colored this far down
const TINT_FULL_DARK_PX = 2800; // ~233m - reaches full darkness at this depth

function colorAtDepth(depthPx) {
  if (depthPx <= TINT_PLATEAU_PX) return SURFACE_WATER_COLOR;
  const t = Phaser.Math.Clamp((depthPx - TINT_PLATEAU_PX) / (TINT_FULL_DARK_PX - TINT_PLATEAU_PX), 0, 1);
  return lerpColor(SURFACE_WATER_COLOR, DEEP_WATER_COLOR, t * t);
}

// Plastic Lure, Colossal Bait, Shimmering Lure, Abyssal Bait, and Chum
// Bait (Bait Crate rewards - see baitData.js) are universal: unlike every
// real bait here, nothing turns any of them down regardless of what it
// actually eats. Deep Sea Bait is NOT universal - it's real bait, not a
// lure, so it only tempts what Squid itself would (see
// speciesAcceptsBait below).
const UNIVERSAL_BAIT = new Set(['plastic_lure', 'colossal_bait', 'shimmering_lure', 'abyssal_bait', 'chum_bait']);

// Neither lure is food - nothing's actually eating it - so unlike real
// bait, a lure survives a catch most of the time (see catchFish) instead
// of being consumed on every single one.
const LURE_ITEMS = new Set(['plastic_lure', 'shimmering_lure']);
const LURE_LOSS_CHANCE = 0.2;

// Whether a species will actually bite a given bait - species without a
// `baits` list (sharks, Megalodon) accept whatever's equipped, since their
// own eligibility is already gated by SHARK_BAIT at spawn time; everything
// else only bites bait it's realistically listed as eating (see
// fishData.js), so equipping the wrong one for a fish just never works -
// unless it's one of the universal lures above, or Deep Sea Bait, which
// counts as Squid itself for this check (it's not universal, just always
// treated as the same real bait Squid already is).
function speciesAcceptsBait(itemId, baitId) {
  if (UNIVERSAL_BAIT.has(baitId)) return true;
  const info = getCatchable(itemId);
  const effectiveBaitId = baitId === 'deep_sea_bait' ? 'squid' : baitId;
  return !info.baits || info.baits.includes(effectiveBaitId);
}

// No fish can realistically swallow bait dramatically bigger than itself -
// a caught fish equipped as bait (the only bait with an actual weight) gets
// rejected by anything it outweighs by more than this multiple.
const MAX_BAIT_WEIGHT_RATIO = 5;

function baitTooHeavyFor(itemId, sizeRoll, baitWeightKg) {
  if (baitWeightKg == null) return false;
  const info = getCatchable(itemId);
  const bitingWeightKg = (info.baseWeightKg || 1) * (sizeRoll || 1);
  return baitWeightKg > bitingWeightKg * MAX_BAIT_WEIGHT_RATIO;
}

export default class OceanScene extends Phaser.Scene {
  constructor() {
    super('OceanScene');
  }

  create() {
    this.cameras.main.setZoom(this.scale.width / DESIGN_WIDTH);
    this.cameras.main.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;

    this.waveT = 0;
    this.phase = 'diving';
    this.landedCatch = null;
    this.maxDepthPx = currentUpgrade(GameState.lineLengthTier).maxDepth;
    this.depthOrigin = 0;
    // How far "down" the world content is currently scrolled - NOT real
    // camera scroll. Every other scene positions its UI using the
    // setZoom+centerOn trick (see below), which permanently offsets the
    // camera's actual scroll to a non-zero baseline; real camera scrolling
    // on top of that would silently break every button's position (that
    // baseline is exactly what setScrollFactor(0) would cancel out). So
    // "diving deeper" is simulated by translating a dedicated world
    // container instead, leaving the camera itself untouched and every
    // fixed-position HUD element working exactly like it does everywhere
    // else in this game.
    this.scroll = { y: 0 };
    this.swimmers = [];
    this.nextSwimmerId = 1;
    this.hook = { x: width / 2, y: 0 };
    this.hookSpeed = 0;
    this.pointerActive = false;
    this.pointerTargetX = this.hook.x;
    this.pointerTargetY = this.hook.y;

    this.worldContainer = this.add.container(0, 0);

    // Depth-tinted water fills the whole world, redrawn every frame from
    // the current view band - cheap (one rect) and needs no giant
    // pre-rendered texture.
    this.waterG = this.add.graphics();
    this.worldContainer.add(this.waterG);

    // The exact same sky/sea/sun composition as TitleScene, positioned at
    // the top of the world - diving is just this content sliding up out of
    // view into the water drawn by waterG.
    this.skyG = this.add.graphics();
    const skyTop = shadeColor(SKY_COLOR, 0.85);
    const skyBottom = shadeColor(SKY_COLOR, 1.2);
    this.skyG.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1);
    this.skyG.fillRect(0, 0, width, WATERLINE_Y + 260);
    this.worldContainer.add(this.skyG);
    const sunG = this.add.graphics();
    drawSunGlow(sunG, 800, 110);
    this.worldContainer.add(sunG);
    this.seaG = this.add.graphics();
    this.worldContainer.add(this.seaG);
    this.renderSurfaceSea(0);

    this.fishG = this.add.graphics();
    this.worldContainer.add(this.fishG);
    this.hookG = this.add.graphics();
    this.worldContainer.add(this.hookG);

    this.statusBar = addStatusBar(this, GameState);
    this.depthText = this.add.text(34, 118, '', label('14px', { color: '#bfe9ff' }));
    this.messageText = this.add.text(width / 2, 60, '', subheading('16px')).setOrigin(0.5);

    createIconButton(this, width - 40, 92, 22, drawBagIcon, () => this.scene.start('InventoryScene'));
    createIconButton(this, width - 95, 92, 22, drawShopIcon, () => this.scene.start('ShopScene'));
    createIconButton(this, width - 150, 92, 22, drawPencilIcon, () => this.scene.start('FishIndexScene'));

    this.input.on('pointermove', (pointer) => {
      if (this.phase !== 'playing') return;
      this.pointerTargetX = pointer.worldX;
      this.pointerTargetY = pointer.worldY + this.scroll.y;
      this.pointerActive = true;
    });

    this.input.on('wheel', (pointer, over, dx, dy) => {
      if (this.phase !== 'playing') return;
      this.pointerTargetY = Phaser.Math.Clamp(
        this.pointerTargetY + dy * WHEEL_DEPTH_FACTOR,
        this.depthOrigin,
        this.depthOrigin + this.maxDepthPx
      );
      this.pointerActive = true;
    });

    this.startDive();
  }

  renderSurfaceSea(t) {
    this.seaG.clear();
    this.seaG.fillStyle(SURFACE_WATER_COLOR, 1);
    this.seaG.fillPoints(buildSeaPolygon(DESIGN_WIDTH, DESIGN_HEIGHT, WATERLINE_Y, t), true);
  }

  // Phase 1 - the view starts framed exactly like the title screen (sky
  // above, sea below) and sinks straight down until it's fully submerged.
  startDive() {
    this.phase = 'diving';
    this.tweens.add({
      targets: this.scroll,
      y: DIVE_TARGET_SCROLL,
      duration: 1500,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.depthOrigin = DIVE_TARGET_SCROLL;
        this.hook.y = this.depthOrigin;
        this.startHookDrop();
      }
    });
  }

  // Phase 2 - the hook and line drop in from above the top of the now-fully
  // -underwater screen down to a shallow resting depth.
  startHookDrop() {
    this.phase = 'dropping';
    this.hook.x = DESIGN_WIDTH / 2;
    this.hook.y = this.depthOrigin - 60;
    this.pointerTargetX = this.hook.x;
    this.pointerTargetY = this.depthOrigin + 90;
    this.tweens.add({
      targets: this.hook,
      y: this.depthOrigin + 90,
      duration: HOOK_DROP_MS,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.phase = 'playing';
        this.scheduleSpawn();
      }
    });
  }

  scheduleSpawn() {
    if (this.phase !== 'playing') return;
    this.spawnTimer = this.time.delayedCall(Phaser.Math.Between(SPAWN_MIN_MS, SPAWN_MAX_MS), () => {
      this.trySpawnFish();
      this.scheduleSpawn();
    });
  }

  pickSpawnId() {
    const baitId = GameState.equippedBait;
    const hookDepth = this.hook.y - this.depthOrigin;
    if (baitId && hookDepth >= SHARK_MIN_DEPTH) {
      for (const sharkId of Object.keys(SHARK_BAIT)) {
        const config = SHARK_BAIT[sharkId];
        // Most sharks just use the shared SHARK_MIN_DEPTH gate above - a
        // handful of genuine deep-water species (the Six Gilled Shark) carry
        // their own deeper minDepth override on top of it.
        if (config.minDepth != null && hookDepth < config.minDepth) continue;
        // Chum Bait's own Mythic-tier specialty (see baitData.js) - it
        // tempts a shark regardless of the real prey species list every
        // other bait is held to here.
        const sharkBites = config.baits.includes(baitId) || baitId === 'chum_bait';
        if (sharkBites && Math.random() < config.chance) return sharkId;
      }
    }
    // Rays answer to the stackable bait item itself, not a caught fish -
    // no depth gate, since (unlike the sharks) they're meant to be a
    // realistic, fairly reachable outcome of fishing with Squid. Chum
    // Bait works here too, at Squid's own strength - the same Mythic
    // specialty as the shark check above.
    if (baitId === 'squid' || baitId === 'prawn' || baitId === 'chum_bait') {
      for (const rayId of Object.keys(RAY_BAIT)) {
        const config = RAY_BAIT[rayId];
        const chance = baitId === 'prawn' ? config.prawnChance : config.squidChance;
        if (Math.random() < chance) return rayId;
      }
    }
    if (baitId && WHALE_BAIT.includes(baitId)) {
      let whaleChance = WHALE_CHANCE;
      if (baitId === 'abyssal_bait') whaleChance = WHALE_CHANCE_ABYSSAL;
      else if (baitId === 'chum_bait') whaleChance = WHALE_CHANCE_CHUM;
      else if (baitId === 'shimmering_lure') whaleChance = WHALE_CHANCE_SHIMMERING;
      else if (baitId === 'colossal_bait') whaleChance = WHALE_CHANCE_COLOSSAL;
      else if (baitId === 'plastic_lure') whaleChance = WHALE_CHANCE_LURE;
      else if (baitId === 'deep_sea_bait') whaleChance = WHALE_CHANCE_DEEP_SEA;
      if (Math.random() < whaleChance) return 'humpback_whale';
    }
    const isAbyssalBait = baitId === 'abyssal_bait';
    // The three Bait Crate lures (see baitData.js) each carry a bit of
    // "luck" - a graduated ladder, not a single on/off flag: Plastic Lure
    // the least, Shimmering Lure a bit more, Abyssal Bait the most (the
    // only one that also blows through an abyss fish's own depth gate,
    // see below). None of this ever overrides a real depth gate for a
    // species that isn't already eligible here.
    const legendaryBoostCopies = isAbyssalBait ? 1 : baitId === 'shimmering_lure' ? 2 : baitId === 'plastic_lure' ? 1 : 0;
    const abyssBoostCopies = baitId === 'shimmering_lure' ? 1 : 0;
    const pool = NORMAL_POOL.filter((id) => {
      const limits = DEPTH_LIMITS[id];
      if (!limits) return true;
      // Abyssal Bait blows straight through any abyss fish's own depth
      // gate - the whole point of fishing with it is pulling something
      // that deep up from anywhere.
      if (isAbyssalBait && ABYSS_FISH.includes(id)) return true;
      if (limits.min != null && hookDepth < limits.min) return false;
      if (limits.max != null && hookDepth >= limits.max) return false;
      return true;
    });
    if (isAbyssalBait) {
      // Abyss fish get a real boost - and since their own depth gate was
      // just bypassed above, they're always in the pool to boost in the
      // first place.
      ABYSS_FISH.forEach((id) => {
        for (let i = 0; i < ABYSS_BOOST_COPIES; i += 1) pool.push(id);
      });
    } else if (abyssBoostCopies > 0) {
      // Shimmering Lure's much smaller version of the above - only for
      // abyss fish already eligible at the current depth, never bypassing
      // their gate the way Abyssal Bait does.
      ABYSS_FISH.forEach((id) => {
        if (pool.includes(id)) {
          for (let i = 0; i < abyssBoostCopies; i += 1) pool.push(id);
        }
      });
    }
    if (legendaryBoostCopies > 0) {
      // Legendary-tier normal-pool fish get a nudge, and only when they'd
      // already be eligible here regardless - this never overrides a real
      // depth gate for anything.
      NORMAL_POOL_LEGENDARY.forEach((id) => {
        if (pool.includes(id)) {
          for (let i = 0; i < legendaryBoostCopies; i += 1) pool.push(id);
        }
      });
    }
    if (baitId === 'colossal_bait') {
      // Colossal Bait's own Epic-tier specialty - skews toward the
      // physically biggest species in the pool (NORMAL_POOL_BIG, by
      // baseWeightKg) rather than value rank, and only among species
      // already eligible at the current depth.
      NORMAL_POOL_BIG.forEach((id) => {
        if (pool.includes(id)) {
          for (let i = 0; i < COLOSSAL_BOOST_COPIES; i += 1) pool.push(id);
        }
      });
    }
    return Phaser.Utils.Array.GetRandom(pool);
  }

  trySpawnFish() {
    if (this.swimmers.length >= MAX_FISH) return;
    const itemId = this.pickSpawnId();
    const fromLeft = Math.random() < 0.5;
    const y = Phaser.Math.Clamp(
      this.scroll.y + Phaser.Math.Between(60, DESIGN_HEIGHT - 60),
      this.depthOrigin,
      this.depthOrigin + this.maxDepthPx
    );
    const x = fromLeft ? -40 : DESIGN_WIDTH + 40;
    const dirSign = fromLeft ? 1 : -1;
    const speed = SWIM_SPEED[itemId] || 40;
    // Repurposes each species' old reel-fight difficultyMultiplier as a
    // wariness factor now that there's no reel minigame to apply it to - a
    // rarer/tougher species (higher multiplier) spooks at a lower hook
    // speed than a common one does.
    const wariness = getCatchable(itemId).difficultyMultiplier || 1;
    this.swimmers.push({
      id: this.nextSwimmerId++,
      itemId,
      isBoot: itemId === 'old_boot',
      // Every real shark is a key in SHARK_BAIT (that's the only way any of
      // them ever spawn), so checking membership there covers all 23 of
      // them without hardcoding a growing list of species names.
      isShark: itemId in SHARK_BAIT,
      wariness,
      spooked: false,
      x,
      y,
      vx: dirSign * speed,
      vy: Phaser.Math.FloatBetween(-6, 6),
      state: 'cruising',
      sizeRoll: Phaser.Math.FloatBetween(0.75, 1.75)
    });
  }

  updateHook() {
    const prevX = this.hook.x;
    const prevY = this.hook.y;
    if (this.pointerActive) {
      this.hook.x += (this.pointerTargetX - this.hook.x) * HOOK_FOLLOW_EASE;
      this.hook.y += (this.pointerTargetY - this.hook.y) * HOOK_FOLLOW_EASE;
    }
    this.hook.x = Phaser.Math.Clamp(this.hook.x, 24, DESIGN_WIDTH - 24);
    this.hook.y = Phaser.Math.Clamp(this.hook.y, this.depthOrigin, this.depthOrigin + this.maxDepthPx);
    this.hookSpeed = Phaser.Math.Distance.Between(prevX, prevY, this.hook.x, this.hook.y);
  }

  updateScroll() {
    // Scale.ENVELOP crops the canvas symmetrically top-and-bottom on any
    // window wider than the design's 960x600 (1.6:1) ratio - true of most
    // maximized widescreen browser windows (16:9 is already 1.78:1). Capping
    // scroll against the full nominal DESIGN_HEIGHT assumes all 600 design
    // units are visible, when in practice only visibleHeight of them are -
    // the rest lands in the cropped-off strip. That silently ate the bottom
    // of the reachable range: a line's advertised max depth would sit inside
    // that invisible strip and never actually appear to be reached. Deriving
    // the real visible height from the live canvas aspect ratio (same trick
    // already used to keep the status bar clear of the crop) keeps the true
    // max depth exactly at the real visible bottom edge, whatever the
    // window's proportions are.
    const visibleHeight = Math.min(DESIGN_HEIGHT, (DESIGN_WIDTH * this.scale.height) / this.scale.width);
    const maxScroll = Math.max(this.depthOrigin, this.depthOrigin + this.maxDepthPx - visibleHeight);
    const target = Phaser.Math.Clamp(this.hook.y - visibleHeight * CAMERA_VIEW_OFFSET, this.depthOrigin, maxScroll);
    this.scroll.y += (target - this.scroll.y) * CAMERA_FOLLOW_EASE;
  }

  updateSwimmers(deltaMs) {
    const dt = deltaMs / 1000;
    const hook = this.hook;
    const hookIsCalm = this.hookSpeed <= CALM_SPEED;
    const hookIsStill = this.hookSpeed <= STILL_SPEED;
    const equippedBaitId = GameState.equippedBait;
    const baitEquipped = !!equippedBaitId;
    const hookDepth = hook.y - this.depthOrigin;
    // Stackable bait (Prawns/Squid) has no weight to compare, so it's never
    // "too heavy" - this only ever matters when a specific caught fish is
    // equipped as bait (see GameState.equipBait's uid form).
    const equippedCatch =
      GameState.equippedCatchUid != null ? GameState.data.catches.find((c) => c.uid === GameState.equippedCatchUid) : null;
    const equippedBaitWeightKg = equippedCatch ? equippedCatch.weightKg : null;

    for (let i = this.swimmers.length - 1; i >= 0; i -= 1) {
      const f = this.swimmers[i];
      const dx = hook.x - f.x;
      const dy = hook.y - f.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      // A more wary species (see trySpawnFish) spooks at a lower hook
      // speed than a common one does.
      const fleeThreshold = FLEE_SPEED_THRESHOLD / (f.wariness || 1);

      // The checks below only gate the MOMENT a fish becomes 'attracted' -
      // without this, a fish that got attracted while valid bait was
      // equipped would keep right on homing in (and biting) even if the
      // player swapped to bait it can't/won't eat mid-chase, since nothing
      // else ever re-examines an already-'attracted' fish's state. This
      // demotes it back to cruising the instant the current bait stops
      // being valid for it, so it loses interest instead of finishing the
      // bite on something it never should've gone for.
      if (
        f.state === 'attracted' &&
        !f.isBoot &&
        baitEquipped &&
        (!speciesAcceptsBait(f.itemId, equippedBaitId) || baitTooHeavyFor(f.itemId, f.sizeRoll, equippedBaitWeightKg))
      ) {
        f.state = 'cruising';
      }

      if (f.isBoot) {
        // Junk isn't alive - it never flees a fast hook, and it isn't
        // lured by bait either, but it can still drift in and attach
        // whenever it happens to be near the hook, any hook state.
        if (f.state !== 'attracted' && dist < STILL_ATTRACT_RADIUS + 30 && Math.random() < BOOT_ATTACH_CHANCE_PER_TICK) {
          f.state = 'attracted';
        }
      } else if (f.spooked) {
        // Once scared off by a fast-moving hook, a fish never trusts it
        // again - no more bait attraction, no more still-hook luck, it
        // just keeps clearing out until it swims off and despawns.
        f.state = 'fleeing';
      } else if (!f.isShark && this.hookSpeed > fleeThreshold && dist < FLEE_RADIUS) {
        f.state = 'fleeing';
        f.spooked = true;
      } else if (
        baitEquipped &&
        hookIsCalm &&
        dist < ATTRACT_RADIUS &&
        speciesAcceptsBait(f.itemId, equippedBaitId) &&
        !baitTooHeavyFor(f.itemId, f.sizeRoll, equippedBaitWeightKg)
      ) {
        f.state = 'attracted';
      } else if (!baitEquipped && hookIsStill && dist < STILL_ATTRACT_RADIUS && f.state !== 'attracted') {
        if (Math.random() < STILL_BITE_CHANCE_PER_TICK) f.state = 'attracted';
      }

      if (f.state === 'attracted' && !f.isBoot) {
        // Junk has no will of its own - "attracted" for a boot only ever
        // means "close enough that a snag roll can catch it" (see above),
        // never a directed swim toward the hook the way a real lured fish
        // gets here. Falls through to the passive drift below instead.
        const speed = (SWIM_SPEED[f.itemId] || 40) * 1.3;
        f.vx = (dx / dist) * speed;
        f.vy = (dy / dist) * speed;
      } else if (f.state === 'fleeing') {
        const speed = (SWIM_SPEED[f.itemId] || 40) * 1.8;
        f.vx = -(dx / dist) * speed;
        f.vy = -(dy / dist) * speed;
      } else {
        f.vy = Phaser.Math.Clamp(f.vy + Phaser.Math.FloatBetween(-4, 4), -20, 20);
      }

      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.y = Phaser.Math.Clamp(f.y, this.depthOrigin, this.depthOrigin + this.maxDepthPx);

      if (f.state === 'attracted' && dist < CATCH_RADIUS) {
        // A shark is genuinely on the hook right now, this deep - the one
        // and only moment a Megalodon can turn up, swapped in at the last
        // instant instead of ever swimming around as itself.
        if (f.isShark && hookDepth >= MEGALODON_MIN_DEPTH && Math.random() < MEGALODON_CHANCE) {
          f.itemId = 'megalodon';
        }
        this.catchFish(f);
        this.swimmers.splice(i, 1);
        continue;
      }

      if (f.x < -80 || f.x > DESIGN_WIDTH + 80) {
        this.swimmers.splice(i, 1);
      }
    }
  }

  // Whatever's biting gets reeled straight up off the top of the screen
  // before anything else happens - the deeper it was hooked, the faster
  // the hook travels, so a catch from way down doesn't take forever to
  // land (REEL_UP_MIN_MS/MAX_MS clamp the trip either way).
  catchFish(f) {
    const info = getCatchable(f.itemId);
    const weightKg = Math.round(info.baseWeightKg * f.sizeRoll * 10) / 10;
    const value = Math.max(1, Math.round(weightKg * info.valuePerKg));
    const depthPx = Math.max(0, this.hook.y - this.depthOrigin);

    this.phase = 'reeling';
    if (this.spawnTimer) this.spawnTimer.remove(false);
    this.landedCatch = { itemId: f.itemId, weightKg };

    const targetY = this.depthOrigin - 60;
    const duration = Phaser.Math.Clamp(depthPx * REEL_UP_MS_PER_PX, REEL_UP_MIN_MS, REEL_UP_MAX_MS);

    this.tweens.add({
      targets: this.hook,
      y: targetY,
      duration,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        if (GameState.equippedBait) {
          // Neither lure is food - nothing's actually eating it, so it
          // doesn't get used up on every single catch the way real bait
          // does. Instead it only has a chance of being lost/damaged in
          // the process, same idea as a snagged or bitten-off lure in
          // real fishing.
          const isLure = LURE_ITEMS.has(GameState.equippedBait);
          if (!isLure || Math.random() < LURE_LOSS_CHANCE) {
            GameState.consumeEquippedBait();
          }
        }
        GameState.addCatch(f.itemId, weightKg, value);
        this.statusBar.refresh();
        this.landedCatch = null;
        this.showCatchReveal(f.itemId, info.name, weightKg, value, () => this.startHookDrop());
      }
    });
  }

  showCatchReveal(itemId, name, weightKg, value, onDone) {
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;
    const cx = width / 2;
    const cy = height / 2 - 30;
    const scale = REVEAL_SCALE[itemId] || 0.8;

    // A soft rarity-coloured glow behind the reveal art - Phaser's Graphics
    // has no native blur, so this is layered translucent rings (largest,
    // most transparent first) approximating a radial glow instead. Drawn
    // (and added to the fade tween) before the fish itself so it always
    // sits behind it.
    const glowG = this.add.graphics();
    const glowColor = rarityColorFor(itemId).glow;
    const glowRadius = Phaser.Math.Clamp(70 * scale, 50, 170);
    [
      [1, 0.05],
      [0.75, 0.08],
      [0.55, 0.12],
      [0.35, 0.18]
    ].forEach(([rf, a]) => {
      glowG.fillStyle(glowColor, a);
      glowG.fillCircle(cx, cy, glowRadius * rf);
    });

    const g = this.add.graphics();
    const drawer = DRAWERS[itemId];
    if (drawer) drawer(g, cx, cy, scale, 0, 1);

    const txt = this.add
      .text(cx, cy + 100, `Caught a ${weightKg}kg ${name}!\nWorth ~$${value}`, {
        ...subheading('18px', { color: '#ffe17d' }),
        align: 'center'
      })
      .setOrigin(0.5);

    glowG.setAlpha(0);
    g.setAlpha(0);
    txt.setAlpha(0);
    this.tweens.add({
      targets: [glowG, g, txt],
      alpha: 1,
      duration: 250,
      yoyo: true,
      hold: 1300,
      onComplete: () => {
        glowG.destroy();
        g.destroy();
        txt.destroy();
        onDone();
      }
    });
  }

  redrawWaterTint() {
    const topDepth = Math.max(0, this.scroll.y - this.depthOrigin);
    const bottomDepth = Math.max(0, this.scroll.y - this.depthOrigin + DESIGN_HEIGHT);
    const topColor = colorAtDepth(topDepth);
    const bottomColor = colorAtDepth(bottomDepth);
    this.waterG.clear();
    this.waterG.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
    this.waterG.fillRect(0, this.scroll.y - 4, DESIGN_WIDTH, DESIGN_HEIGHT + 8);
  }

  redrawFishAndHook() {
    const g = this.fishG;
    g.clear();
    this.swimmers.forEach((f) => {
      const drawer = DRAWERS[f.itemId];
      if (!drawer) return;
      const facingRight = f.vx >= 0;
      const tilt = Phaser.Math.Clamp(f.vy / 80, -0.3, 0.3);
      const scale = (SWIM_SCALE[f.itemId] || 0.5) * Phaser.Math.Clamp(f.sizeRoll, 0.55, 1.9);
      g.save();
      g.translateCanvas(f.x, f.y);
      g.scaleCanvas(facingRight ? -1 : 1, 1);
      g.rotateCanvas(tilt);
      drawer(g, 0, 0, scale, 0, 1);
      g.restore();
    });

    const hg = this.hookG;
    hg.clear();
    if (this.phase !== 'diving') {
      hg.lineStyle(1.5, 0xf0f0f0, 0.85);
      hg.beginPath();
      hg.moveTo(this.hook.x, this.depthOrigin - 60);
      hg.lineTo(this.hook.x, this.hook.y);
      hg.strokePath();

      const dangle = Math.sin(this.waveT * 3) * 0.15;
      if (this.landedCatch && DRAWERS[this.landedCatch.itemId]) {
        // Whatever just got caught rides up on the hook during the reel-in,
        // instead of the bait that was there before it bit. Uses its own
        // SWIM_SCALE (how big it looked alive a second ago), not
        // BAIT_HOOK_SCALE - that constant is tuned "modest" for bait
        // dangling before any bite, and reusing it here made every catch
        // visibly shrink the instant it bit, before jumping back up for the
        // reveal. Megalodon has no SWIM_SCALE (it never swims as itself),
        // so it falls back to its own deliberately huge BAIT_HOOK_SCALE.
        const lc = this.landedCatch;
        const reelScale = SWIM_SCALE[lc.itemId] ?? BAIT_HOOK_SCALE[lc.itemId] ?? 0.4;
        const scale = reelScale * Phaser.Math.Clamp(lc.weightKg / (getCatchable(lc.itemId).baseWeightKg || 1), 0.55, 1.9);
        DRAWERS[lc.itemId](hg, this.hook.x + 2, this.hook.y + 1, scale, dangle, 1);
      } else {
        const baitId = GameState.equippedBait;
        if (baitId && DRAWERS[baitId]) {
          const equippedCatch = GameState.data.catches.find((c) => c.uid === GameState.equippedCatchUid);
          const baitScale = BAIT_HOOK_SCALE[baitId] * (equippedCatch ? Phaser.Math.Clamp(equippedCatch.weightKg / (getCatchable(baitId).baseWeightKg || 1), 0.55, 1.9) : 1);
          // A solid lure doesn't wriggle like real bait - it hangs still
          // on the line, so it skips the same dangle wobble every other
          // bait gets here.
          const baitDangle = LURE_ITEMS.has(baitId) ? 0 : dangle;
          DRAWERS[baitId](hg, this.hook.x + 2, this.hook.y + 1, baitScale, baitDangle, 1);
        }
      }
      drawHook(hg, this.hook.x, this.hook.y, 0.6, 0, 1);
    }
  }

  update(time, deltaMs) {
    this.waveT += deltaMs * 0.001;
    this.renderSurfaceSea(this.waveT);

    if (this.phase === 'playing') {
      this.updateHook();
      this.updateScroll();
      this.updateSwimmers(deltaMs);
      const depthM = Math.round((this.hook.y - this.depthOrigin) / 12);
      this.depthText.setText(`Depth: ${depthM}m`);
    }

    // Everything "underwater" (sky/sea/water tint/fish/hook) lives in
    // worldContainer at absolute content coordinates - shifting the whole
    // container by -scroll.y each frame is what makes diving/descending
    // actually move the view, while every fixed-position HUD element
    // (status bar, nav icons, depth text) stays exactly where it always is.
    this.worldContainer.y = -this.scroll.y;

    this.redrawWaterTint();
    this.redrawFishAndHook();
  }
}
